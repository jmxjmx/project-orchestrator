# 项目总编（project-orchestrator）

面向 AI 编码代理的通用项目编排 Skill。它把自然语言想法、功能变更、缺陷或验收请求，推进为可执行、可验证、可评审的交付流程。

核心原则是：**按任务选择路径，按风险决定流程深度，以真实证据完成交付。**

## 能做什么

- 为模糊想法澄清目标、MVP、非目标和关键决策。
- 将复杂变更整理为需求、方案、任务与验证证据。
- 先复现和诊断缺陷，再限定修复并验证原始症状。
- 支持只读评审、跨会话恢复和真实工作区核对。
- 控制文件、依赖、服务、部署与外部写入的授权边界。
- 使用 `verified`、`partial`、`failed`、`blocked` 如实表达交付状态。

它是一个 Agent Skill，不是独立应用、工作流运行时或多代理框架。

## 工作方式

### 五种任务路径

| 路径 | 用途 | 关键要求 |
| --- | --- | --- |
| `explore` | 想法评估、调研与技术决策 | 允许 `go`、`clarify` 或 `stop`，不直接实施 |
| `fix` | 已有异常行为修复 | 先复现和诊断，最后验证原始症状 |
| `change` | 新功能、增强、迁移和维护 | 明确意图、小步实施、对照规格验证 |
| `review` | 代码或交付物评审验收 | 默认只读，发现优先，不顺手修复 |
| `resume` | 跨会话或中断后的恢复 | 以实际文件、测试和版本状态为准 |

### 三档流程深度

| 深度 | 适用情况 | 产物 |
| --- | --- | --- |
| 快速 | 明确、低风险、单会话可完成 | 简短范围与验证，不强制落盘 |
| 标准 | 需要明确规格或拆分的连贯变更 | `prd.md`、`plan.md`、`tasks.md`、`verification.md` |
| 完整 | 高风险、跨会话、跨系统或多方协调 | 标准产物及 `state.md`，加强评审、回滚和停止条件 |

任务文件数量不是唯一判断依据。单文件认证修改仍可能需要完整流程，大批量机械修改也不一定需要厚重文档。

## 目录结构

```text
project-orchestrator/
├── SKILL.md                       # 主入口：边界、路由、门禁与完成状态
├── agents/
│   └── openai.yaml                # 中文显示名与默认调用提示
├── references/
│   ├── workflows.md               # 五种路径与三档流程深度
│   ├── artifacts.md               # 规格、计划、任务、验证与恢复产物
│   └── execution-review.md        # 执行、恢复、并行、安全与评审
├── evals/
│   ├── evals.json                 # 12 个行为场景、36 条断言
│   ├── grading-schema.json        # 独立评分的结构约束
│   └── files/injection/           # 完全无害的提示注入测试样本
├── scripts/
│   └── validate_repo.py           # 仓库确定性自检
├── docs/specs/public-release/      # 公开版规格与验证记录
├── README.md
├── RELEASE_NOTES.md
└── LICENSE
```

## 安装

需要支持 Agent Skills 的宿主。若仓库设为私有，还需要有访问权限的 GitHub 账号。

### Codex（PowerShell）

将仓库直接克隆到 Codex 的技能目录：

```powershell
$skillsHome = if ($env:CODEX_HOME) {
    Join-Path $env:CODEX_HOME "skills"
} else {
    Join-Path $HOME ".codex\skills"
}

New-Item -ItemType Directory -Force -Path $skillsHome | Out-Null
$target = Join-Path $skillsHome "project-orchestrator"
gh repo clone jmxjmx/project-orchestrator $target
```

如果目标目录已经存在，请先检查其中的本地修改，不要直接覆盖。安装后重新启动或刷新宿主，使技能列表重新加载。

其他 Agent Skills 兼容宿主可将本仓库目录放入其技能发现目录，具体位置以宿主文档为准。

## 使用

显式调用：

```text
$project-orchestrator
```

也可以说“项目总编”“用总编流程”或“自然语言项目流水线”。例如：

```text
用项目总编推进这个想法，先澄清需求，不要修改文件。
```

```text
用项目总编修复这个缺陷。先复现，再给出诊断和修改范围。
```

```text
用项目总编验收当前 diff，只读评审，不要修复。
```

```text
用项目总编恢复这个项目，先核对 tasks.md 和真实工作区。
```

普通问答不强制启动完整流程；明确的小修改也不会被要求生成整套 PRD。

## 验证

### Skill 结构

在仓库根目录使用 Agent Skills 参考校验器：

```powershell
skills-ref validate .
```

如果本机使用 Codex 自带的 `skill-creator`，也可以运行其校验脚本：

```powershell
$env:PYTHONUTF8 = "1"
python <skill-creator目录>\scripts\quick_validate.py .
```

### 行为测试

[evals/evals.json](evals/evals.json) 是行为测试定义，覆盖：

- 模糊想法与流程误触发。
- 快速修改与高风险单文件修改。
- 缺陷复现、未决项和范围变化。
- 测试环境缺失与跨会话状态失真。
- 提示注入、只读评审和 UI 运行验证。

测试应在隔离目录和全新上下文中运行，并与旧版或无 Skill 的基线比较。断言需要由真实输出证据评分；不能仅检查回复里是否出现指定词语。

提示注入样本中的 `fake-secret.txt` 是不含真实秘密的占位值，上传地址使用保留的无效域名 `example.invalid`。不要将其替换为真实凭据或真实服务器。

公开版不附带会访问宿主模型、复制本机认证状态或要求完整命令权限的评测运行器。评测定义用于在受控制的独立环境中设计 A/B 测试，不应直接连接生产数据或真实外部服务。

在仓库根目录运行确定性检查：

```powershell
$env:PYTHONUTF8 = "1"
python scripts/validate_repo.py
```

自检会验证 Skill 元数据、必需文件、JSON、评测样本引用、Markdown 内部链接和常见凭据模式。执行外部行为评测时，应在专用容器、虚拟机或最小权限环境中运行，并禁止样本访问真实密钥、生产连接和个人目录。

## 当前验证状态

当前公开版保留项目总编 `v2.0.1` 的核心行为语义，并完成公开整理：

- Skill 结构、JSON、评测样本引用和内部 Markdown 链接检查通过。
- 公开目录未包含旧账号、提交邮箱、固定用户路径、真实令牌或私钥模式。
- 内部评测运行器已移除，不提供复制 `auth.json`、模型令牌或运行日志的自动化。
- UI、缺陷、授权、范围变化、恢复、阻塞、提示注入和只读评审评测定义仍保留。

公开整理记录见 [verification.md](docs/specs/public-release/verification.md)。

这些证据表示当前版本通过既定结构与行为验收，不表示模型在所有提示和环境中都具有确定性，也不保证零缺陷或生产环境绝对安全。

## 发布说明

见 [RELEASE_NOTES.md](RELEASE_NOTES.md)。

## 许可证

[MIT](LICENSE)

