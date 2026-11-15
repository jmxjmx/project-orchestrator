# 公开版验证记录

状态：`verified`

检查日期：2026-11-15

## 已完成证据

| 需求/场景 | 验证方法与环境 | 实际结果 | 证据 | 状态 |
|---|---|---|---|---|
| AC-001 | 检索旧账号、提交邮箱、机器用户路径、旧模型路由和旧提交号 | 无命中 | 隐私模式检索退出码 0 | 通过 |
| AC-001 | 检查新 Git 配置和引用 | 无远程、无提交、分支为 `main` | `git status`、`git remote`、`git rev-list` | 通过 |
| AC-002 | `python scripts/validate_repo.py` | 返回 0 | `passed: true`、12 个场景、36 条断言 | 通过 |
| AC-003 | 检查公开目录 | 无内部评测运行器、认证文件或 Codex 临时目录 | 文件清单与模式检索 | 通过 |
| AC-004 | 检查 README 安装地址 | 指向当前发布账号 | README 安装段落 | 通过 |
| 结构安全 | 常见 Token、私钥和邮箱模式检索 | 无命中 | 检索退出码 0 | 通过 |
| JavaScript | `node --check` 检查评测脚本 | 4 个文件语法通过 | 命令退出码 0 | 通过 |
| 源目录隔离 | 检查源仓库状态 | 工作区干净且未修改 | 源仓库 `git status` | 通过 |
| AC-005 | 检查 GitHub 仓库和远端分支 | 公共仓库，默认分支为 `main` | [jmxjmx/project-orchestrator](https://github.com/jmxjmx/project-orchestrator) | 通过 |
| AC-005 | 对比本地与远端提交 | 哈希一致 | `99019d1451ba410629d3a95b0cf4559e9369a46e` | 通过 |

## 尚未执行

- 尚未使用独立外部密钥扫描器或 GitHub 仓库 Secret Scanning。

## 剩余风险

- 公开上传后仍应检查 GitHub 提交作者、仓库可见性和 Secret Scanning 结果。
- 评测样本仅可用于隔离环境，不应加入真实凭据、生产连接或个人目录。

## 发布证据

- 仓库：<https://github.com/jmxjmx/project-orchestrator>
- 首个公开提交：`99019d1451ba410629d3a95b0cf4559e9369a46e`
- 提交身份：`jmxjmx <jmxjmx@users.noreply.github.com>`
