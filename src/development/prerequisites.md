---
title: 前置准备
icon: toolbox
---

# 前置准备

开始 AI 开发前，需要先准备基本的软件和账号。本文列出当前开发流程中使用的工具，并说明各自的用途。

## 电脑中需要安装的软件

具体软件会根据项目类型变化。AI 开发入门阶段，建议准备以下软件：

- **Google Chrome**：用于搜索资料、阅读官方文档、访问 GitHub、调试网页，以及使用在线 AI 开发工具。
- **Visual Studio Code**：用于查看和编辑代码、配置文件及 Markdown 文档。
- **Clash Verge**：用于管理网络代理。在部分开发场景中，访问 GitHub、下载依赖或连接海外服务可能需要代理支持，是否使用代理需要根据实际网络环境决定。
- **Docker Desktop**：用于运行容器化应用，统一项目运行环境，减少不同电脑之间的环境差异。
- **Git**：用于管理代码版本、下载 Git 仓库，并与远程仓库同步代码。安装 Git 后，可以直接使用 Git Bash 执行开发命令。
- **Node.js v22.23.2**：用于运行 JavaScript、TypeScript 项目，以及使用 npm、pnpm 等包管理工具。
- **Notepad--**：用于快速查看和修改文本、配置文件及日志，适合进行简单的文本编辑和临时修改。
- **Codex（ChatGPT）**：用于辅助阅读代码、编写代码、解释报错和修改项目文件。

**Python** 属于可选软件。涉及 AI 调用脚本、数据处理程序或 Python 后端项目时，再根据项目要求安装对应版本。

## 需要准备的账号

- **GitHub 账号**：用于保存个人代码、下载和管理开源项目、阅读项目文档、提交 Issue，以及参与协作开发。账号密码、访问令牌和 SSH 密钥等信息需要妥善保管。

## 软件从哪里下载

软件下载优先选择官方渠道：

1. 官方网站的下载页面。
2. 官方 GitHub 仓库的 Releases 页面。
3. 操作系统官方应用商店或软件包仓库。
4. 项目官方文档提供的安装地址。

搜索结果中的第三方下载站、网盘链接和来历不明的安装包需要谨慎使用。下载前需要核对域名、软件名称、版本信息和发布者，避免安装被篡改的软件。

常见软件的官方入口：

- Visual Studio Code：<https://code.visualstudio.com/>
- Git：<https://git-scm.com/downloads>
- Node.js：<https://nodejs.org/en/download>
- Docker Desktop：<https://www.docker.com/products/docker-desktop/>
- Notepad--：<https://github.com/cxasm/notepad-->
- Python：<https://www.python.org/downloads/>
- GitHub：<https://github.com/>

Clash Verge 和 Codex（ChatGPT）的安装方式需要以对应项目或服务的官方渠道为准。部分工具通过命令行安装，部分工具以桌面应用、编辑器扩展或网页服务形式提供。下载时需要核对软件名称、版本信息和发布者，避免从来历不明的第三方渠道获取安装包。

## 安装后检查

安装完成后，可以通过版本命令进行基础检查：

```bash
git --version
node --version
```

Python 为可选软件，安装后再执行：

```bash
python --version
```

如果命令无法识别，需要检查软件是否安装成功、安装目录是否加入环境变量，以及当前 Git Bash 是否需要重新打开。

安装前还需要确认当前操作系统、CPU 架构、软件版本要求、管理员权限、磁盘空间和网络连接是否满足要求。

---

返回 [开发指南](/development/)。
