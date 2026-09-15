---
title: 从零开始：小白技术指南
icon: seedling
article: false
---

# 从零开始：小白技术指南

欢迎来到面向技术初学者的实践指南。本系列从基础的操作系统机制、软硬件认知与网络基础讲起，通过剖析系统工作原理与标准操作链路，带你一步步建立起清晰的技术认知与工具使用习惯。

---

## 篇章一：电脑与网络基础

在开始学习代码与前沿 AI 之前，先打理好自己的数字环境与思维模式。

### 1. 提问与解决

解决技术问题的核心在于建立排查链路：从捕获异常现场、分析日志线索，到运用关键词精准检索与规范求助。

- **[学会提问](/guide/troubleshooting/ask-questions)**：如何把问题背景、复现步骤和尝试过程清晰表达，赢得高效高质量的解答。
- **[使用搜索引擎](/guide/troubleshooting/search-engine)**：掌握关键词精炼、搜索语法（inurl/site/filetype）以及从庞杂信息中快速淘金。
- **[遇到报错和系统问题如何解决](/guide/troubleshooting/error-handling)**：读懂报错日志（Error log）、学会保留现场、定位关键异常与常见救砖思路。

### 2. 操作与软件

让你的操作系统成为顺手、干净、高效的生产力利器。

- **[基础操作是什么](/guide/operations/basic-operations)**：日常高频快捷键、剪贴板管理、任务管理器排查、文件组织与路径思维。
- **[如何安装和卸载软件](/guide/operations/software-management)**：官方来源鉴别、区分便携版/安装版、避开捆绑全家桶与干净彻底卸载。

### 3. 网络与连接

现代软件开发与 AI 使用离不开稳定安全的网络基石。

- **[不同浏览器的区别](/guide/network/browser-differences)**：Chromium、Gecko 与 WebKit 内核差异，Chrome、Edge、Firefox 的特性对比与选择建议。
- **[为什么要使用 VPN 代理](/guide/network/why-vpn-proxy)**：理解代理（Proxy）与 VPN 的基本工作原理、开发者为什么离不开代理、常见分流与协议常识。

---

## 篇章二：开发环境与工具

掌握现代开发的核心工具链，为编写、管理和分享代码做好全面准备。

### Git 与 GitHub：版本控制入门实战

从"为什么需要版本控制"到"参与全球开源社区"，完整六篇循序渐进：

- **[Git 与 GitHub 究竟是什么：版本控制与工作原理](/guide/git/git-and-github-concept)**：从手动复制文件的痛点切入，讲透 Git 与 GitHub 的本质分工以及分布式数据流转的工作机制。
- **[环境安装、身份配置与网络连接](/guide/git/installation-and-auth)**：Windows 全步骤安装向导逐页拆解、SSH 公私钥认证配置，以及国内网络卡点排查与代理加速。
- **[单人核心操作流与安全红线](/guide/git/basic-workflow)**：工作区-暂存区-版本库三层流转原理、Conventional Commits 约定式提交全景字典，以及 `.gitignore` 安全防线。
- **[远程联动与云端代码托管：VS Code 可视化实战](/guide/git/remote-and-collaboration)**：抛开黑色终端，全程以 VS Code 源代码管理面板完成 Diff 对比、一键发布 GitHub、同步推送与项目克隆。
- **[分支机制、冲突处理与版本撤销](/guide/git/branch-and-conflict)**：分支零成本创建原理、VS Code 可视化冲突裁决，以及四大代码回退"后悔药"救急指南。
- **[GitHub Pull Request 协作流：从提 PR 到参与开源](/guide/git/github-pull-request)**：团队内部 PR 规范、Fork 工作流参与开源、Squash 压扁合并策略与 Sync fork 一键同步。

### 2. 开发环境筑基：在写第一行代码之前

把电脑调教成专业的开发机，彻底打破终端、路径与运行环境的黑盒感：

- **[终端与命令行到底是什么：从图形化到指令集](/guide/env/terminal-and-cli-basics)**：讲透人机交互底层逻辑、理清 Terminal 与 Shell 分工，掌握相对/绝对路径实战演练与规范命名习惯。
- **[彻底搞懂环境变量 PATH：终结“找不到命令”的噩梦](/guide/env/path-environment-variable)**：拆解系统三步寻宝机制、掌握 which/where 排查，以 Node.js 为例演示 Linux (Vim) 与 Windows 属性配置全流程。
- **[代码运行环境（Runtime）：为什么双击跑不起来代码？](/guide/env/runtime-and-interpreters)**：剖析 CPU 只认二进制的物理现实、编译型 vs 解释型两条路线，Runtime 三大件构成与多版本隔离机制。
- **[专业开发者的工作区与依赖管理思维](/guide/env/workspace-and-package-manager)**：无中文空格工作区规划、项目标准解剖图（src/ vs dist/）、愿望单 package.json 与收银小票 lockfile 深度剖析。

---

## 后续篇章规划（敬请期待）

- **篇章三：编程入门实战**（从零上手现代编程语言、VS Code 深度插件配置）
- **篇章四：AI 工具与实战赋能**（Prompt 核心心法、主流大模型盘点、AI 辅助编程实战）
