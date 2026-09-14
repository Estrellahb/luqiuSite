---
title: 环境安装、身份配置与网络连接
icon: key
category:
  - 小白指南
tag:
  - Git
  - 安装配置
  - SSH
  - 凭证认证
  - 网络排查
---

# 环境安装、身份配置与网络连接

在使用 Git 管理代码或将项目推送到 GitHub 之前，必须先在本地电脑上完成两项基础设施搭建：**安装 Git 命令行客户端** 与 **打通与 GitHub 云端服务器的安全通信链路**。

初学者在这一步常常会面临"安装向导选项繁多不知如何抉择"、"配了用户名邮箱却不知道作何用途"、以及"终端连接 GitHub 频繁报网络超时"等卡点。本篇将拆解背后的工作逻辑，带你完成标准的开发环境部署。

---

## 一、安装 Git 客户端

根据你的操作系统，选择对应的部署指引。Windows 端提供了全步骤的详细向导拆解：

::: tabs
@tab Windows
### 1. 官网下载与安装包版本选择
1. 打开浏览器，访问 [Git 官方网站 (git-scm.com)](https://git-scm.com/)；
2. 网站首页右侧的显示屏插画旁，会自动识别你的 Windows 系统，点击绿色的 **「Install for Windows」**（或「Download for Windows」）；
3. 页面跳转至 Windows 下载列表，在「Standalone Installer」（独立安装程序）分类下，点击 **「64-bit Git for Windows Setup」** 开始下载安装程序（文件名通常类似 `Git-2.4x.x-64-bit.exe`）。

::: tip 官网下载缓慢的备选方案
如果受跨国网络波动影响导致官网下载进度缓慢，可以使用国内镜像源进行高速下载：
访问 [淘宝 npm 镜像站 Git for Windows 分发列表](https://registry.npmmirror.com/binary.html?path=git-for-windows/)，进入最新的稳定版本目录（如 `v2.4x.x.windows.1/`），下载其中的 `Git-...-64-bit.exe` 即可。
:::

---

### 2. 安装向导逐页配置指南（Step by Step）
双击运行下载好的 `.exe` 安装程序，进入标准向导流程：

#### Step 1: GNU General Public License（开源许可协议）
- **界面说明**：展示 GPL 开源软件授权条款。
- **操作**：直接点击右下角的「Next」。

#### Step 2: Select Destination Location（安装路径选择）
- **界面说明**：设置 Git 核心文件在本地硬盘的解压目录。
- **推荐做法**：默认路径为 `C:\Program Files\Git`，保持默认即可。如果需要更改到其他磁盘分区（例如 `D:\Git`），**必须确保所选路径中不包含中文字符或特殊空格**，避免后续部分第三方开发工具因编码问题无法解析路径。
- **操作**：确认路径后点击「Next」。

#### Step 3: Select Components（选择安装组件）
- **界面说明**：选择需要安装的系统扩展与右键菜单功能。
- **推荐勾选项**：
  - `[x] Additional icons` `→` `(按需) On the Desktop`：勾选后在桌面生成终端快捷方式；
  - `[x] Windows Explorer integration`：**强烈建议勾选**。它包含 `Git Bash Here` 和 `Git GUI Here`，允许你在任意项目文件夹的空白处点击鼠标右键，直接打开当前路径的 Git 终端；
  - `[x] Git LFS (Large File Support)`：推荐勾选，提供对大容量音视频或模型文件的版本追踪支持；
  - `[x] Associate .git* configuration files with the default text editor`：推荐勾选，方便后续快速用编辑器修改配置文件；
  - 其余项保持默认即可。
- **操作**：配置完成后点击「Next」。

#### Step 4: Select Start Menu Folder（开始菜单快捷方式）
- **界面说明**：设置在 Windows 开始菜单中生成的文件夹名称。
- **操作**：保持默认的 `Git`，点击「Next」。

#### Step 5: Choosing the default editor used by Git（选择默认文本编辑器）
- **界面说明**：当执行需要编写多行说明的 Git 操作时，Git 自动唤起的编辑软件。
- **推荐选择**：安装向导默认选中 `Use Vim as Git's default editor`。由于命令行 Vim 的操作逻辑特殊（退出需要依赖特定的快捷键组合 `:wq`），初学者容易产生卡顿。**建议展开下拉菜单**：
  - 如果电脑中已安装 VS Code，推荐选择 **`Use Visual Studio Code as Git's default editor`**；
  - 如果未安装专业编辑器，推荐选择 **`Use Notepad as Git's default editor`**（系统自带记事本）。
- **操作**：选好编辑器后点击「Next」。

#### Step 6: Adjusting the name of the initial branch in new repositories（新仓库默认分支名）
- **界面说明**：在本地执行新建仓库时初始主分支的名称。
- **推荐选择**：
  - 选择第二项 **`Override the default branch name for new repositories`**，并在输入框中保持默认的 **`main`**。
  - **机制原因**：早期版本 Git 默认使用 `master`，而 GitHub、GitLab 等现代代码托管平台现已统一采用 `main` 作为主干分支名称。将本地默认值设为 `main`，可以确保新建的本地仓库与云端平台的分支命名规则一致，避免初次推送时因分支名不同引发歧义。
- **操作**：点击「Next」。

#### Step 7: Adjusting your PATH environment（系统环境变量配置）
- **界面说明**：决定系统中有哪些终端环境可以直接运行 `git` 命令。
- **选项解析与推荐**：
  - 1. *Use Git from Git Bash only*（仅限专属 Git 终端使用，不写入系统变量）；
  - 2. **`Git from the command line and also from 3rd-party software`（推荐选择）**：将 Git 的核心执行路径注入 Windows 全局 PATH 环境变量。选择此项后，无论是系统自带的 CMD、PowerShell、Windows Terminal，还是 VS Code 的内置终端，都可以直接调用 `git` 命令；
  - 3. *Use Git and optional Unix tools from the Command Prompt*（会将大量 Linux 工具混入 Windows 系统目录，容易覆盖系统原有命令，不推荐）。
- **操作**：确认勾选第 2 项，点击「Next」。

#### Step 8: Choosing the SSH executable（选择 SSH 客户端）
- **推荐选择**：保持默认的 **`Use bundled OpenSSH`**（使用 Git 自带的 OpenSSH 套件，避免与系统其他版本冲突）。
- **操作**：点击「Next」。

#### Step 9: Choosing HTTPS transport backend（选择 HTTPS 传输后端）
- **推荐选择**：保持默认的 **`Use the OpenSSL library`**（行业通用的加密认证库，具备最广泛的证书兼容性）。
- **操作**：点击「Next」。

#### Step 10: Configuring the line ending conversions（换行符转换机制）
- **界面说明**：处理不同操作系统对文本文件"换行"记录方式的差异。
- **机制原因**：Windows 系统的文本换行符由两个字符组成：回车符与换行符，记为 `CRLF`（`\r\n`）；而 Linux 与 macOS 系统仅使用一个换行符，记为 `LF`（`\n`）。如果在跨平台协作中不加约束，会导致代码在不同系统打开时被误判为"每一行都发生了改动"。
- **推荐选择**：选择第一项 **`Checkout Windows-style, commit Unix-style line endings`**（对应底层配置 `core.autocrlf = true`）。它的运作机制是：代码从仓库拉取到本地时自动转为 Windows 习惯的 CRLF，代码提交回版本库时自动转换为统一的 LF 换行符。
- **操作**：确认选中第 1 项，点击「Next」。

#### Step 11: Configuring the terminal emulator to use with Git Bash（Git Bash 窗口引擎）
- **推荐选择**：保持默认的 **`Use MinTTY (the default terminal of MSYS2)`**（支持更流畅的字符渲染、窗口缩放与颜色主题）。
- **操作**：点击「Next」。

#### Step 12: Choose the default behavior of `git pull`（拉取合并策略）
- **推荐选择**：保持默认的 **`Default (fast-forward or merge)`**（标准的快进或合并模式）。
- **操作**：点击「Next」。

#### Step 13: Choosing a credential helper（凭据管理器）
- **推荐选择**：保持默认的 **`Git Credential Manager`**。这是微软官方维护的凭据安全存储组件，它可以在你首次连接 GitHub 时自动弹出交互式登录窗口，并将鉴权令牌加密保存在系统凭据库中，避免后续重复输入密码。
- **操作**：点击「Next」。

#### Step 14: Configuring extra options（性能与实验性功能）
- **推荐选择**：
  - `[x] Enable file system caching`（启用文件系统内存缓存，加快大仓库运行速度，保持勾选）；
  - 实验性特性页面的选项全部**保持不勾选**，确保基础环境的长期稳定性。
- **操作**：点击右下角 **「Install」** 开始部署。

---

### 3. 安装验证
等待安装进度条读完，取消勾选「View Release Notes」，点击「Finish」退出向导。

进行双重验证：
1. **桌面菜单**：在桌面空白处点击鼠标右键，查看是否出现了 **`Open Git Bash here`** 选项；
2. **终端检测**：按键盘快捷键 `Win + R` 输入 `powershell` 回车，在终端中运行：
   ```powershell
   git --version
   ```
   若终端输出类似 `git version 2.4x.x.windows.1` 的版本号，代表 Git 已经正确就绪。

@tab macOS
macOS 系统部署推荐采用以下两种标准化路径之一：

### 方式一：安装 Xcode 命令行开发套件（推荐）
macOS 官方提供了轻量级的命令行开发工具包，自带苹果适配的 Git 版本。

1. 按快捷键 `Cmd + Space` 打开聚焦搜索，输入「终端」（Terminal）并回车；
2. 在终端窗口中粘贴以下命令并运行：
   ```bash
   xcode-select --install
   ```
3. 系统会自动弹出「命令行开发者工具」安装提示窗口，点击「安装」并同意许可协议，等待下载安装完毕即可。

### 方式二：使用 Homebrew 包管理器安装
如果你已经在 Mac 上配置了 Homebrew，可以直接通过它获取官方最新构建版本：
```bash
brew install git
```

### 验证结果
在终端中执行：
```bash
git --version
```
输出 `git version 2.x.x` 即代表安装成功。

@tab Linux (Ubuntu/Debian)
Debian 与 Ubuntu 体系的发行版可通过官方软件仓库直接安装：

1. 打开终端，更新本地软件包索引并安装 Git：
   ```bash
   sudo apt update
   sudo apt install git -y
   ```
2. 验证安装：
   ```bash
   git --version
   ```
:::

---

## 二、初始身份声明（全局配置）

在安装完 Git 后，系统需要知道"是谁在编写和提交代码"。我们需要在全局配置中声明开发者昵称和邮箱：

```bash
git config --global user.name "你的英文昵称"
git config --global user.email "你的常用邮箱@example.com"
```

::: info 深入理解 user.name 和 user.email 的运作机制
刚接触 Git 的同学经常会对这两项配置产生疑问。理解其背后机制有助于规范使用：

1. **它是本地提交的"数字签名印章"**：
   这里的名字和邮箱仅仅是一段元数据，会被永久写入每一次代码快照（Commit）的日志记录中，用于在多人协作时追踪每一行代码的作者。它不会连接网络验证密码，与任何云端平台的登录账号是解耦的；
2. **GitHub 贡献绿墙的统计依据**：
   当你把代码推送到 GitHub 时，GitHub 会提取每一次提交中的 `user.email`。如果这个邮箱与你在 GitHub 账号设置中绑定的邮箱一致，GitHub 就会将这次提交识别为你本人的工作，并在个人主页的贡献热力图（绿墙）中记录活跃点。
:::

### 查看与修改配置
执行以下命令可以打印当前生效的所有 Git 全局配置参数：

```bash
git config --global --list
```

如果后续更换了邮箱或拼写有误，只需重新执行对应的 `git config --global ...` 命令，新值就会直接覆盖旧值。

---

## 三、打通与 GitHub 的身份认证链路

将本地代码推送到 GitHub 仓库属于写操作，云端服务器必须对使用者的身份与权限进行严格校验。

早期开发者习惯直接输入账号密码，但静态密码容易遭到撞库与泄漏。GitHub 已经全面停用了基于普通密码的 Git 命令行推送，转而要求使用**公私钥对（SSH Key）**或**个人访问令牌（Personal Access Token）**。

其中，**SSH 密钥认证**是一次配置、永久免密且安全性极高的主流方案。

### 1. 非对称加密的工作逻辑
SSH 认证基于非对称加密算法，它由一对互相配对的密钥组成：
- **私钥（`id_ed25519`）**：留存在你本地电脑的专用目录中，具有排他访问权限，严禁向外泄漏；
- **公钥（`id_ed25519.pub`）**：一段公开的文本，上传并存放在 GitHub 网站后台（相当于一把挂在云端的电子锁）。

每次在终端推送代码时，GitHub 会利用保存在其服务器上的公钥生成一段随机挑战密文，本地 Git 客户端使用只有你持有的私钥进行解密并回传验证。解密成功即可确认请求确实由你本人发起，安全建立通信链路，全程无需反复手动输入密码。

```text
[ 本地电脑 ]                                    [ GitHub 云端服务器 ]
┌─────────────────────────┐                     ┌─────────────────────────┐
│ 私钥: id_ed25519        │                     │ 公钥: id_ed25519.pub    │
│ (妥善保存在本地，不对外公开) │                     │ (提前上传到 GitHub 后台)  │
│                         │                     │                         │
│ 用私钥解密并回传证明 ────┼───── 验证通过 ─────→ │ 发送加密验证请求        │
└─────────────────────────┘                     └─────────────────────────┘
```

---

### 2. 第一步：在本地生成 SSH 密钥对
打开终端，运行密钥生成命令。算法推荐选择目前计算效率更高、抗碰撞强度更好的 `ed25519`：

```bash
ssh-keygen -t ed25519 -C "你的GitHub邮箱@example.com"
```

命令触发后，终端会依次出现交互提示：
1. `Enter file in which to save the key (...):`
   询问密钥存放的文件路径。直接按 **回车**，接受默认路径即可；
2. `Enter passphrase (empty for no passphrase):`
   询问是否为私钥本身再设置一道开机保护密码。个人电脑通常直接连续按 **两次回车** 留空，即可实现后续推送代码免密执行。

---

### 3. 第二步：查看并完整复制公钥

::: tabs
@tab Windows (PowerShell)
```powershell
Get-Content ~/.ssh/id_ed25519.pub
```
@tab macOS / Linux
```bash
cat ~/.ssh/id_ed25519.pub
```
:::

终端会打印出一行以 `ssh-ed25519` 开头、以你填写的邮箱结尾的长字符串。**鼠标选中并完整复制整行文本**。

---

### 4. 第三步：将公钥添加至 GitHub
1. 打开浏览器登录 [GitHub 官网](https://github.com/)；
2. 点击网页右上角的个人头像 `→` 选择 **「Settings」**；
3. 在页面左侧导航栏中找到 **「SSH and GPG keys」**；
4. 点击右上角绿色的 **「New SSH key」** 按钮进入添加页；
5. 在输入表单中：
   - **Title**：输入当前设备的标识备注（例如 `Home-PC` 或 `Work-Laptop`），方便多台电脑时识别管理；
   - **Key type**：保持默认的 `Authentication Key`；
   - **Key**：将刚才复制的以 `ssh-ed25519` 开头的完整公钥文本粘贴进来；
6. 点击下方绿色的 **「Add SSH key」** 保存。系统可能会弹出对话框要求输入一次 GitHub 网页密码以确认安全授权。

---

### 5. 第四步：测试安全握手连通性
在本地终端中运行以下测试命令，检验密钥配对是否生效：

```bash
ssh -T git@github.com
```

::: warning 首次连接的主机指纹确认
如果是初次通过 SSH 连接 GitHub 服务器，终端会出现如下交互询问：
```text
The authenticity of host 'github.com (20.205.243.166)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
这是 SSH 协议在防止中间人伪造服务器，询问你是否信任该主机公钥指纹。直接输入 **`yes`** 并按回车即可。
:::

如果配置无误，终端会输出：
```text
Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.
```
只要看到包含 `successfully authenticated` 字样，就代表本地与 GitHub 的 SSH 鉴权链路已经彻底打通。

---

## 四、国内网络环境下的常见卡点与排查

国内连接 GitHub 服务器常受到国际出口线路拥塞或特定协议端口拦截影响。以下是两类最典型的网络故障与对应的排查方案：

### 1. SSH 22 端口超时（Connection timed out）
默认情况下，SSH 连接使用标准的 `22` 端口。部分地区的运营商网络、校园网或公司防火墙可能会限制外部主机的 22 端口通信，导致 `ssh -T git@github.com` 长时间卡住并报错超时。

**解决方案：切换为 443 备用端口**

在本地电脑的用户家目录下找到 `.ssh` 文件夹（即 `~/.ssh/`），创建或修改一个名为 `config` 的纯文本文件（没有扩展名），写入以下内容：

```text
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
```

保存文件后重新在终端执行 `ssh -T git@github.com`。流量会自动重定向至 443 端口，能够有效解决 22 端口被拦截的问题。

---

### 2. 终端走代理工具加速
如果你本地运行着代理客户端（例如在本地监听了 `7890` 端口的代理服务），浏览器可以正常打开 GitHub 网页，但命令行终端在拉取代码时依然频繁提示 `Connection reset by peer`。

出现这种现象的物理原因是：**系统终端默认不会继承桌面代理客户端的流量转发规则**。

你可以专门针对 GitHub 域名配置 Git 的局部网络代理：

```bash
# 假设本地代理客户端监听的 Socks5 端口为 7890（请根据实际客户端参数调整）
git config --global http.https://github.com.proxy socks5://127.0.0.1:7890
```

::: tip 为什么要限定针对 github.com 走代理？
上面的配置参数名是 `http.https://github.com.proxy`，它的工程价值在于：**只把针对 github.com 域名的流量导向本地代理端口**。

当后续访问国内代码平台（例如 Gitee、公司内网 GitLab）时，流量依然直连，不会被额外绕路，兼顾了访问安全与速率。
:::

如果日后网络环境变化不再需要代理，执行以下命令即可清除该局部配置：

```bash
git config --global --unset http.https://github.com.proxy
```

---

::: tip 下一步学习
至此，Git 客户端已完成标准化安装，全局身份签名已确认，与 GitHub 之间的安全通信链路也已打通。

下一篇我们将正式进入核心实战：**[单人核心操作流与安全红线](/guide/git/basic-workflow)**。我们将深入拆解工作区、暂存区与版本库的三层状态流转，掌握代码提交的标准闭环，以及绝对不能提交上库的安全防范规则。
:::
