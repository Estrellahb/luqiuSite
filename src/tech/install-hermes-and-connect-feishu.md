---
title: 如何安装 Hermes 并连接飞书
icon: robot
date: 2026-07-24
category:
  - 技术笔记
tag:
  - Hermes
  - AI Agent
  - 飞书
  - Gateway
---

Hermes Agent 是 Nous Research 开源的通用 AI Agent。它可以在终端中运行，也可以通过飞书、Telegram、Discord、Slack、微信等消息平台接收任务。

项目地址：[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)

官方文档：[Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/)

Hermes 可以安装在 Linux、macOS 和 Windows Subsystem for Linux（WSL）平台。本文的安装环境为 **Linux Ubuntu 22.04**，后续 Hermes 相关教程也以该环境为主，介绍 Hermes 的特点、安装和模型配置，以及通过 WebSocket 连接飞书的完整流程。

## Hermes 是什么

Hermes 可以调用终端、文件、浏览器、网络搜索、定时任务、图像生成等工具完成实际操作。会话、用户偏好、任务经验和工具配置可以保存在本地，重新启动后仍能继续使用。

它和 Claude Code、Codex、OpenClaw 等产品属于同类工具，但侧重点有所不同。

### 模型和服务商可以自由切换

Hermes 支持 OpenRouter、Anthropic、OpenAI、DeepSeek、Gemini、GitHub Copilot、Nous Portal 等服务，也可以接入 OpenAI 兼容接口或本地模型。

模型和服务商可以通过命令重新选择：

```bash
hermes model
```

这种设计减少了对单一模型平台的依赖，也方便根据任务类型、费用和可用性调整模型。

### Skills 可以积累工作流程

Hermes 的 Skills 用于保存可复用的操作规范。文章发布、服务器部署、代码审查、数据整理等流程可以分别做成 Skill，在相关任务出现时加载。

除了安装社区 Skill，也可以把已经验证过的处理方法保存为本地 Skill。长期使用后，常见任务不需要每次重新说明完整规则。

### 支持持久记忆和会话恢复

Hermes 可以保存用户偏好、环境信息和稳定约定，也能管理历史会话。中断的对话可以继续，适合需要多轮沟通或长期维护的工作。

常用会话命令包括：

```bash
hermes sessions list
hermes sessions browse
hermes --continue
```

### 消息平台和终端使用同一套工具

连接飞书后，终端中的文件操作、命令执行、定时任务、网页检索等能力仍然可用。服务器上的 Hermes Gateway 负责接收消息、调用 Agent，并把结果发回飞书。

### 支持定时任务和多 Agent 协作

Hermes 内置 Cron、Delegation、Profiles 和 Kanban 等能力。定时简报、周期检查、长任务拆分、多个独立 Agent 并行处理等场景不需要额外搭建一套调度程序。

::: info 与其他 Agent 的选择差异
Claude Code 和 Codex 更偏向代码仓库内的开发任务；Hermes 同时覆盖终端、消息平台、定时任务、持久记忆和 Skills。需要在服务器长期运行，并通过飞书接收日常任务时，Hermes 的完整度更高。
:::

## 安装前的准备

### 运行环境

Hermes 支持以下安装环境：

1. Linux 服务器或 Linux 桌面环境
2. macOS
3. Windows 的 WSL 环境

Linux、macOS 和 WSL 使用同一条安装命令。本文后续命令、目录和服务管理方式均以 **Ubuntu 22.04** 为基准。安装程序会自动处理 Python 3.11、Node.js、ripgrep、ffmpeg、虚拟环境和 Hermes 命令，不需要提前逐项安装。

安装前只需要确认 Git 和 curl 可用：

```bash
git --version
curl --version
```

如果是 Ubuntu 或 Debian，可以先安装：

```bash
sudo apt update
sudo apt install -y git curl
```

### 准备模型服务

Hermes 本身不包含在线大模型额度，需要准备一种可用的模型服务。常见选择包括：

- OpenRouter API Key
- Anthropic API Key
- DeepSeek API Key
- Google Gemini API Key
- Nous Portal 或 OpenAI Codex OAuth
- OpenAI 兼容中转接口
- 本地模型接口

API Key 属于敏感信息，不应出现在公开文章、截图、Git 仓库或聊天记录中。

### 准备飞书账号

飞书连接需要具备创建企业自建应用的权限。如果当前企业限制创建应用，需要由飞书管理员协助创建或授权。

推荐使用 WebSocket 模式。Hermes 会主动连接飞书，不需要公网回调地址、域名或 Nginx 反向代理，适合部署在家庭设备、内网主机和云服务器上。

## 安装 Hermes

### Linux、macOS 和 WSL

执行官方安装脚本：

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

安装完成后重新加载 Shell 环境：

```bash
source ~/.bashrc
```

使用 zsh 时执行：

```bash
source ~/.zshrc
```

检查版本：

```bash
hermes --version
```

如果提示 `hermes: command not found`，可以检查 `~/.local/bin` 是否已经加入 `PATH`：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

## 逐步配置 Hermes Agent

### 运行完整配置向导

执行：

```bash
hermes setup
```

向导会依次引导完成大模型服务、工具和消息网关等配置。已经通过安装程序进入初始化向导时，按终端提示继续即可。

### 选择大模型

执行：

```bash
hermes model
```

Hermes 支持 Nous Portal、OpenRouter、OpenAI、Anthropic、DeepSeek、Kimi、MiniMax、Gemini 等服务，也可以配置 OpenAI 兼容接口。选定服务后，根据终端提示完成登录或填写 API Key，再选择需要使用的模型。

模型配置后可以再次运行 `hermes model` 切换服务商或模型，不需要重新安装 Hermes。

### 配置工具

执行：

```bash
hermes tools
```

工具配置界面用于启用或停用文件操作、Shell 命令、网络检索、浏览器、图像处理、定时任务等模块。工具可用范围应根据服务器用途和安全要求设置。

### 配置飞书消息网关

执行：

```bash
hermes gateway setup
```

在平台列表中选择 `Feishu / Lark`。支持扫码创建应用时，可以按终端提示使用飞书扫码；已经创建飞书应用时，填写 App ID 和 App Secret。

连接参数选择：

```text
Domain: feishu
Connection mode: websocket
```

国内飞书使用 `feishu`，国际版 Lark 使用 `lark`。WebSocket 模式由 Hermes 主动建立长连接，不需要准备公网回调地址。

### 检查和修改配置

单项配置可以通过以下命令修改：

```bash
hermes config set <key> <value>
```

查看当前配置：

```bash
hermes config
```

配置完成后运行健康检查：

```bash
hermes doctor
```

进入终端对话：

```bash
hermes
```

也可以发送单次任务：

```bash
hermes chat -q "检查当前目录中的项目结构"
```

## 创建飞书应用

打开[飞书开放平台](https://open.feishu.cn/)，进入开发者后台并创建企业自建应用。

### 添加机器人能力

在应用功能中启用机器人，并设置机器人名称和头像。完成后进入“凭证与基础信息”，记录以下内容：

1. App ID
2. App Secret

::: caution 保护 App Secret
App Secret 可以用于调用飞书应用接口。配置截图需要隐藏完整内容，公开仓库中也不能保存真实密钥。
:::

### 配置权限

在“权限管理”中添加消息收发相关权限。不同版本的飞书后台可能使用略有差异的权限名称，至少需要覆盖以下能力：

1. 以应用身份发送消息
2. 接收群聊中提及机器人的消息
3. 读取消息内容
4. 获取消息中的图片和文件资源
5. 读取应用或机器人基本信息

常见权限标识包括：

```text
im:message
im:message:send_as_bot
im:message:receive
im:message:group_at_msg
im:resource
admin:app.info:readonly
```

`admin:app.info:readonly` 用于读取机器人名称等应用信息。缺少该权限时，群聊中的 `@机器人` 识别可能出现异常。

### 添加事件订阅

进入“事件与回调”，选择使用长连接接收事件，并添加消息接收事件：

```text
im.message.receive_v1
```

WebSocket 模式不需要配置公网请求地址，但事件仍然需要在飞书后台订阅。只建立长连接而没有添加消息事件，Hermes 无法收到飞书消息。

需要使用交互式卡片按钮时，还可以订阅：

```text
card.action.trigger
```

同时在机器人能力中启用交互式卡片。

### 发布应用

完成权限和事件配置后创建应用版本并发布。企业内部应用可能需要管理员审核。发布完成后，把机器人添加到测试群聊，或者直接从飞书客户端打开机器人私聊。

## 配置 Hermes 连接飞书

前面的“逐步配置 Hermes Agent”已经通过 `hermes gateway setup` 完成飞书网关配置。自动配置无法完成、扫码创建不可用或需要补充访问策略时，可以使用以下手动配置方式。

### 手动配置（自动配置失败方案）

配置向导无法使用时，可以编辑 Hermes 的环境变量文件：

```bash
hermes config env-path
```

默认路径为：

```text
~/.hermes/.env
```

写入以下内容：

```bash
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=secret_xxx
FEISHU_DOMAIN=feishu
FEISHU_CONNECTION_MODE=websocket
FEISHU_GROUP_POLICY=allowlist
FEISHU_ALLOWED_USERS=ou_xxx
```

字段含义如下：

- `FEISHU_APP_ID`：飞书应用的 App ID
- `FEISHU_APP_SECRET`：飞书应用的 App Secret
- `FEISHU_DOMAIN`：国内飞书填写 `feishu`，国际版填写 `lark`
- `FEISHU_CONNECTION_MODE`：推荐填写 `websocket`
- `FEISHU_GROUP_POLICY`：群聊访问策略，推荐使用 `allowlist`
- `FEISHU_ALLOWED_USERS`：允许使用机器人的飞书用户 Open ID，多个值使用英文逗号分隔

::: tip 私聊和群聊的默认行为
私聊消息会直接进入 Hermes。群聊默认要求明确 `@机器人`，并根据 `FEISHU_GROUP_POLICY` 检查发送者权限。
:::

## 启动 Gateway

首次排查配置时，可以在前台启动：

```bash
hermes gateway run
```

终端没有报错，并显示飞书 WebSocket 已连接后，在飞书中向机器人发送消息进行测试。

Linux 服务器需要长期运行时，安装用户级 systemd 服务：

```bash
hermes gateway install
hermes gateway start
hermes gateway status
```

配置发生变化后重启服务：

```bash
hermes gateway restart
```

系统重启或 SSH 退出后仍需保持服务运行时，可以确认 systemd linger 已启用：

```bash
loginctl show-user "$USER" -p Linger
```

显示 `Linger=yes` 表示用户级服务可以在退出登录后继续运行。未启用时执行：

```bash
sudo loginctl enable-linger "$USER"
```

## 在飞书中测试

### 私聊测试

打开机器人私聊，发送：

```text
介绍一下当前可用的工具
```

收到正常回复后，说明飞书消息、模型服务和 Gateway 已经连通。

### 群聊测试

把机器人加入群聊，发送：

```text
@机器人 检查当前服务器的运行状态
```

群聊中必须实际选择飞书的 `@机器人`，只输入机器人名称不会触发提及事件。

### 设置 Home Channel

需要让定时任务和跨平台通知发送到当前飞书会话时，在目标会话中发送：

```text
/sethome
```

Hermes 会把当前私聊或群聊记录为 Home Channel。也可以在环境变量中手动填写：

```bash
FEISHU_HOME_CHANNEL=oc_xxx
```

## 常见问题

### 私聊正常，群聊没有回复

依次检查以下内容：

1. 机器人是否已经加入群聊
2. 消息中是否真正 `@` 了机器人
3. 是否订阅 `im.message.receive_v1`
4. 是否具备接收群聊消息的权限
5. `FEISHU_GROUP_POLICY` 是否为 `open` 或 `allowlist`
6. 使用 `allowlist` 时，发送者 Open ID 是否已写入 `FEISHU_ALLOWED_USERS`
7. 是否缺少 `admin:app.info:readonly`，导致机器人身份识别失败

### Gateway 无法连接飞书

先检查状态和日志：

```bash
hermes gateway status
hermes logs --follow
```

也可以前台运行，直接查看连接错误：

```bash
hermes gateway stop
hermes gateway run
```

常见原因包括 App ID 或 App Secret 填写错误、应用未发布、权限未审核、事件订阅缺失，以及同一个 App ID 被另一套 Hermes Gateway 占用。

### 修改配置后没有生效

Gateway 会在启动时读取环境变量和配置。修改 `~/.hermes/.env` 或 `config.yaml` 后执行：

```bash
hermes gateway restart
```

终端交互会话中的工具和配置发生变化时，需要退出后重新启动，或者新建会话。

### 命令执行被拦截

飞书中的危险命令可能需要交互式审批。没有配置交互式卡片时，可以先在终端中完成相关操作，或根据实际安全要求调整 Hermes 的审批模式。

推荐使用智能审批：

```bash
hermes config set approvals.mode smart
hermes gateway restart
```

`smart` 会自动放行低风险操作，并保留高风险命令的确认流程。共享服务器上不建议完全关闭审批。

## 参考资料

[飞书官方 Hermes Agent 安装与部署指南](https://www.feishu.cn/content/article/7630758640865037530)
