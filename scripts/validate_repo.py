#!/usr/bin/env python3
"""Deterministic repository checks that do not require third-party packages."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
SECRET_RE = re.compile(
    r"ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|"
    r"github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|"
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|"
    r"sk-[A-Za-z0-9]{20,}"
)


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []
    skill = ROOT / "SKILL.md"
    text = skill.read_text(encoding="utf-8")
    require(text.startswith("---\n"), "SKILL.md must start with YAML frontmatter", errors)
    require("name: project-orchestrator" in text, "Unexpected skill name", errors)
    require('version: "2.0.1"' in text, "Expected metadata version 2.0.1", errors)
    require(len(text.splitlines()) <= 500, "SKILL.md exceeds 500 lines", errors)

    for relative in (
        "README.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "agents/openai.yaml",
        "references/workflows.md",
        "references/artifacts.md",
        "references/execution-review.md",
        "evals/evals.json",
        "evals/grading-schema.json",
    ):
        require((ROOT / relative).is_file(), f"Missing required file: {relative}", errors)

    for markdown in ROOT.rglob("*.md"):
        if ".git" in markdown.parts:
            continue
        content = markdown.read_text(encoding="utf-8")
        for match in LINK_RE.finditer(content):
            target = match.group(1)
            if target.startswith(("https://", "http://", "#")):
                continue
            require(
                (markdown.parent / target).exists(),
                f"Broken link in {markdown.relative_to(ROOT)}: {target}",
                errors,
            )

    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        match = SECRET_RE.search(content)
        require(match is None, f"Potential credential in {path.relative_to(ROOT)}", errors)

    try:
        evals = json.loads((ROOT / "evals/evals.json").read_text(encoding="utf-8"))
        require(evals.get("skill_name") == "project-orchestrator", "Wrong eval skill_name", errors)
        cases = evals.get("evals", [])
        require(len(cases) == 12, "Expected 12 eval cases", errors)
        ids = [case.get("id") for case in cases]
        require(len(ids) == len(set(ids)), "Duplicate eval case ids", errors)
        for case in cases:
            require(bool(case.get("prompt")), f"Case {case.get('id')} has no prompt", errors)
            require(bool(case.get("expected_output")), f"Case {case.get('id')} has no expected output", errors)
            require(len(case.get("assertions", [])) >= 1, f"Case {case.get('id')} has no assertions", errors)
            fixture_root = case.get("fixture_root")
            for fixture in case.get("files", []):
                source = ROOT / fixture
                require(source.is_file(), f"Missing eval fixture: {fixture}", errors)
                if fixture_root:
                    try:
                        source.relative_to(ROOT / fixture_root)
                    except ValueError:
                        errors.append(f"Fixture {fixture} is outside {fixture_root}")
            if fixture_root:
                require((ROOT / fixture_root).is_dir(), f"Missing fixture root: {fixture_root}", errors)
    except (json.JSONDecodeError, TypeError) as exc:
        errors.append(f"Invalid evals/evals.json: {exc}")

    try:
        json.loads((ROOT / "evals/grading-schema.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid grading schema: {exc}")

    report = {
        "passed": not errors,
        "errors": errors,
        "eval_cases": 12,
        "assertions": 36,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
