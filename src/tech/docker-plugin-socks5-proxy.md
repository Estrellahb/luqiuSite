---
title: 国内服务器如何为 Docker 插件配置 SOCKS5 代理：从 SSH 隧道到 systemd 常驻
icon: network-wired
date: 2026-07-06
category:
  - 技术笔记
tag:
  - Docker
  - SOCKS5
  - SSH 隧道
  - systemd
---

在国内服务器环境中，Docker 插件可能需要访问外部 API，例如 GitHub、OpenAI 或其他海外服务。服务器本身的网络访问可能不稳定，或者某些 API 无法直接连通。一种轻量的解决方式是通过 SSH 动态端口转发，在国内服务器上开启一个 SOCKS5 代理端口，让 Docker 插件通过这个端口访问外部网络。

这套方案的核心优点：

- 不需要在国内服务器安装 sing-box、Clash、mihomo
- 不需要导入 Hysteria、HY、V2Ray 等订阅文件
- 不改变整台服务器的全局网络
- 只让指定 Docker 插件走代理
- 可以用 systemd 做成后台服务，开机自启、断线自动重连

最终链路：

```text
Docker 插件容器
↓
国内服务器 SOCKS5 端口
↓
SSH 加密隧道
↓
海外 VPS
↓
外部 API / Google / GitHub / OpenAI 等服务
```

## SOCKS5 代理的本质

这里的 SOCKS5 代理不需要安装完整代理客户端。SSH 自带的 `-D` 参数可以在本地开启一个 SOCKS5 端口。

国内服务器先通过 SSH 连接到海外 VPS，然后在本地开启一个端口，例如 `172.17.0.1:7891`。Docker 插件访问外部 API 时，将代理地址设置为 `socks5://172.17.0.1:7891`，请求就会沿 SSH 隧道从海外 VPS 出口出去。

## Docker 网桥地址问题

插件运行在 Docker 容器内时，容器内部的 `127.0.0.1` 指的是容器自己，不是宿主机。在插件里填写 `socks5://127.0.0.1:7891` 大概率不通，因为 SOCKS5 端口开在宿主机上。

对于 Docker 默认 bridge 网络，宿主机通常有一个 Docker 网桥地址 `172.17.0.1`，容器可以通过这个地址访问宿主机。插件里应填写：

```text
socks5://172.17.0.1:7891
```

如果插件支持 `socks5h://`，更推荐：

```text
socks5h://172.17.0.1:7891
```

`socks5h` 的 DNS 解析也走代理，更适合访问海外 API。

## 前置信息

开始之前，需要确定以下信息：

- `<LOCAL_USER>` — 国内服务器上运行 SSH 隧道的用户，例如 `dockeruser`
- `<VPS_USER>` — 海外 VPS 的 SSH 登录用户
- `<VPS_IP>` — 海外 VPS 的 IP 地址
- `<VPS_SSH_PORT>` — 海外 VPS 的 SSH 端口，例如 22、2222
- `<SOCKS_HOST>` — Docker 网桥地址，通常是 172.17.0.1
- `<SOCKS_PORT>` — SOCKS5 本地端口，例如 7891

## 确认 Docker 网桥地址

```text
ip addr show docker0
```

正常输出类似：

```text
inet 172.17.0.1/16
```

`172.17.0.1` 是 Docker 容器访问宿主机的常用地址。SOCKS5 监听在 `172.17.0.1:7891`，该端口主要给 Docker 容器使用，不直接监听公网，安全性比 `0.0.0.0:7891` 更好。

## 生成专用 SSH Key

在国内服务器上单独生成一把专用 SSH Key，只用于这条 SOCKS5 隧道，避免将本机主力 SSH 私钥上传到服务器。

```text
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/oversea_vps_ed25519 -C "docker-plugin-socks5-proxy"
```

生成过程中会提示输入 passphrase，直接回车跳过（后续 systemd 后台服务需要无密码启动）。

生成后得到两个文件：

```text
~/.ssh/oversea_vps_ed25519      私钥
~/.ssh/oversea_vps_ed25519.pub  公钥
```

权限设置：

```text
chmod 700 ~/.ssh
chmod 600 ~/.ssh/oversea_vps_ed25519
```

私钥必须自己保存，不能泄露。公钥可以放到海外 VPS 的 `authorized_keys` 中。

## 把公钥添加到海外 VPS

**方法一：使用 ssh-copy-id**

如果海外 VPS 允许密码登录或已有旧 key 能登录 VPS：

```text
ssh-copy-id -i ~/.ssh/oversea_vps_ed25519.pub -p <VPS_SSH_PORT> <VPS_USER>@<VPS_IP>
```

注意：`ssh` 和 `ssh-copy-id` 指定端口用小写 `-p`，`scp` 指定端口用大写 `-P`。

成功后，公钥被写入海外 VPS 对应用户的 `/home/<VPS_USER>/.ssh/authorized_keys`。如果目标用户是 root，位置是 `/root/.ssh/authorized_keys`。

**方法二：手动添加**

如果 VPS 只允许 publickey 登录，`ssh-copy-id` 无法登录写入。需要通过 VPS 控制台、网页终端、VNC 或其他已有登录方式手动添加。

先查看公钥内容：

```text
cat ~/.ssh/oversea_vps_ed25519.pub
```

复制输出的一整行，格式类似：

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIxxxxxxxx docker-plugin-socks5-proxy
```

登录海外 VPS 后执行：

```text
sudo mkdir -p /home/<VPS_USER>/.ssh
sudo vim /home/<VPS_USER>/.ssh/authorized_keys
```

粘贴公钥，保存后设置权限：

```text
sudo chown -R <VPS_USER>:<VPS_USER> /home/<VPS_USER>/.ssh
sudo chmod 700 /home/<VPS_USER>/.ssh
sudo chmod 600 /home/<VPS_USER>/.ssh/authorized_keys
```

如果登录的是 root 用户：

```text
sudo mkdir -p /root/.ssh
sudo vim /root/.ssh/authorized_keys
sudo chown -R root:root /root/.ssh
sudo chmod 700 /root/.ssh
sudo chmod 600 /root/.ssh/authorized_keys
```

## 测试 SSH Key 登录

在国内服务器执行：

```text
ssh -i ~/.ssh/oversea_vps_ed25519 \
-o IdentitiesOnly=yes \
-p <VPS_SSH_PORT> \
<VPS_USER>@<VPS_IP>
```

如果可以直接登录，说明 SSH Key 配置成功。如果出现 `Permission denied (publickey).`，通常是以下问题之一：

- 用户名写错了
- SSH 端口写错了
- 公钥放错用户目录了
- `authorized_keys` 权限不对
- 私钥和公钥不是一对
- VPS 的 sshd 配置限制了该用户登录

检查私钥和公钥是否匹配：

```text
ssh-keygen -y -f ~/.ssh/oversea_vps_ed25519
cat ~/.ssh/oversea_vps_ed25519.pub
```

两条命令输出的内容应一致。

## 临时开启 SOCKS5 代理

确认可以 SSH 登录海外 VPS 后，执行：

```text
ssh -i ~/.ssh/oversea_vps_ed25519 \
-o IdentitiesOnly=yes \
-p <VPS_SSH_PORT> \
-N -D 172.17.0.1:7891 \
<VPS_USER>@<VPS_IP>
```

参数说明：

- `-i ~/.ssh/oversea_vps_ed25519` — 指定 SSH 私钥
- `-o IdentitiesOnly=yes` — 强制只使用这把 key
- `-p <VPS_SSH_PORT>` — 指定海外 VPS 的 SSH 端口
- `-N` — 不执行远程命令，只建立隧道
- `-D 172.17.0.1:7891` — 在 Docker 网桥地址上开启 SOCKS5 端口

执行后终端窗口会卡住不动，表示 SOCKS5 隧道正在运行。按 Ctrl+C 或关闭窗口后代理会消失。

## 测试 SOCKS5 是否可用

另开一个终端，在国内服务器执行：

```text
curl -x socks5h://172.17.0.1:7891 https://www.google.com -I
```

如果返回 `HTTP/2 200` 或 `HTTP/1.1 301` / `HTTP/1.1 302`，说明 SOCKS5 已成功。

测试 API 访问：

```text
curl -x socks5h://172.17.0.1:7891 https://api.openai.com/v1/models -I
```

返回 `HTTP/2 401` 也是正常的——没有携带 API Key 请求被拒绝，但网络本身已通。

## 创建 systemd 后台服务

临时命令在终端关闭后代理会消失。使用 systemd 可以把 SSH 隧道做成后台服务，实现开机自启、后台运行、断线自动重连。

**确认当前用户**

```text
whoami
```

假设输出为 `<LOCAL_USER>`，这是 systemd 在国内服务器上使用的运行用户。`<VPS_USER>@<VPS_IP>` 是 SSH 登录海外 VPS 的用户，两者可以不同。

**确认私钥绝对路径**

systemd 服务里不用 `~` 缩写，使用绝对路径：

```text
/home/<LOCAL_USER>/.ssh/oversea_vps_ed25519
```

检查文件是否存在：

```text
ls -l /home/<LOCAL_USER>/.ssh/oversea_vps_ed25519
```

**创建服务文件**

```text
sudo vim /etc/systemd/system/ssh-socks-proxy.service
```

写入以下内容：

```text
[Unit]
Description=SSH SOCKS5 Proxy Tunnel for Docker Plugins
After=network-online.target
Wants=network-online.target

[Service]
User=<LOCAL_USER>
ExecStart=/usr/bin/ssh -i /home/<LOCAL_USER>/.ssh/oversea_vps_ed25519 -p <VPS_SSH_PORT> -N -D 172.17.0.1:7891 <VPS_USER>@<VPS_IP> -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

需要替换的占位符：`<LOCAL_USER>`、`<VPS_USER>`、`<VPS_IP>`、`<VPS_SSH_PORT>`。

SSH 参数含义：

- `StrictHostKeyChecking=accept-new` — 首次连接自动接受主机指纹，避免 systemd 卡在确认提示
- `ServerAliveInterval=30` — 每 30 秒发送一次保活包
- `ServerAliveCountMax=3` — 连续 3 次无响应认为连接断开
- `ExitOnForwardFailure=yes` — 端口监听失败时直接退出，方便 systemd 重启

## 启动服务

```text
sudo systemctl daemon-reload
sudo systemctl enable --now ssh-socks-proxy
```

查看状态：

```text
sudo systemctl status ssh-socks-proxy
```

正常应显示 `Active: active (running)`。

查看端口：

```text
ss -lntp | grep 7891
```

成功后会看到 `172.17.0.1:7891`。

再次测试代理：

```text
curl -x socks5h://172.17.0.1:7891 https://www.google.com -I
```

返回 HTTP 200、301 或 302 说明 SOCKS5 服务已后台常驻成功。

## Docker 插件代理配置

插件代理地址填写：

```text
socks5://172.17.0.1:7891
```

如果插件支持 socks5h，优先使用：

```text
socks5h://172.17.0.1:7891
```

`socks5://` 请求走代理但 DNS 解析可能在容器本地进行，`socks5h://` 请求和 DNS 解析都交给代理处理。

不要填写 `socks5://127.0.0.1:7891`，因为 Docker 容器内的 `127.0.0.1` 是容器自己。

## docker-compose 环境变量方式

部分插件没有图形化代理配置项，但可能读取环境变量：

```text
services:
  your-plugin:
    image: your-plugin-image
    environment:
      - HTTP_PROXY=socks5://172.17.0.1:7891
      - HTTPS_PROXY=socks5://172.17.0.1:7891
      - ALL_PROXY=socks5://172.17.0.1:7891
      - NO_PROXY=localhost,127.0.0.1,::1
```

如果支持 socks5h：

```text
services:
  your-plugin:
    image: your-plugin-image
    environment:
      - HTTP_PROXY=socks5h://172.17.0.1:7891
      - HTTPS_PROXY=socks5h://172.17.0.1:7891
      - ALL_PROXY=socks5h://172.17.0.1:7891
      - NO_PROXY=localhost,127.0.0.1,::1
```

修改后重启容器：

```text
docker compose up -d
```

或：

```text
docker restart <CONTAINER_NAME>
```

不是所有插件都会读取 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY`。如果插件本身有代理配置项，优先使用插件自己的设置。

## 在 Docker 容器内部测试

进入容器：

```text
docker exec -it <CONTAINER_NAME> sh
```

在容器内测试：

```text
curl -x socks5h://172.17.0.1:7891 https://www.google.com -I
```

返回 HTTP 200、301 或 302 说明容器也能访问宿主机上的 SOCKS5 代理。如果容器里没有 curl，可以在宿主机测试，或根据容器系统安装 curl。

## 常用管理命令

查看服务状态：

```text
sudo systemctl status ssh-socks-proxy
```

重启服务：

```text
sudo systemctl restart ssh-socks-proxy
```

停止服务：

```text
sudo systemctl stop ssh-socks-proxy
```

设置开机自启：

```text
sudo systemctl enable ssh-socks-proxy
```

取消开机自启：

```text
sudo systemctl disable ssh-socks-proxy
```

查看日志：

```text
journalctl -u ssh-socks-proxy -e --no-pager
```

实时日志：

```text
journalctl -u ssh-socks-proxy -f
```

查看当前加载的服务配置：

```text
sudo systemctl cat ssh-socks-proxy
```

## 常见问题排查

**status=217/USER**

报错 `status=217/USER` / `Failed to determine user credentials`，说明 `User=<LOCAL_USER>` 写成了一个不存在的用户。执行 `whoami` 确认用户后编辑服务文件修复，然后 `daemon-reload && restart`。

**Identity file not accessible**

日志出现 `Warning: Identity file ... not accessible`，说明私钥路径写错或运行用户没有权限读取。检查并修复私钥属主和权限，然后重启服务。

**status=255/EXCEPTION**

SSH 自身退出，常见原因：

- VPS SSH 端口不通
- VPS 用户名错误
- 私钥路径错误
- 私钥权限不对
- VPS 不接受当前 key
- SSH 首次连接需要确认 known_hosts

先手动 SSH 测试，如果手动都失败，systemd 也一定失败。查看详细日志：

```text
journalctl -u ssh-socks-proxy -e --no-pager
```

**修改 service 文件后未生效**

每次修改后都需要执行：

```text
sudo systemctl daemon-reload
sudo systemctl restart ssh-socks-proxy
```

**ss 看不到 7891 端口**

`ss -lntp | grep 7891` 没有输出，说明 SOCKS5 未成功启动。依次检查 `sudo systemctl status ssh-socks-proxy` 和 `journalctl -u ssh-socks-proxy -e --no-pager`。

## 安全建议

SOCKS5 推荐监听在 `172.17.0.1:7891`，不推荐 `0.0.0.0:7891`。`0.0.0.0` 表示所有网卡都监听，如果防火墙没有限制，可能把 SOCKS5 暴露到公网，存在安全风险。

私钥 `~/.ssh/oversea_vps_ed25519` 不要上传或泄露。可以放到 VPS 上的只有公钥 `~/.ssh/oversea_vps_ed25519.pub`。

这把专用 key 只用于国内服务器到海外 VPS 的 SSH SOCKS5 隧道。后续不再使用时，只需要在海外 VPS 的 `authorized_keys` 中删除对应公钥即可。

## 完整链路

SOCKS5 端口：`172.17.0.1:7891`

测试代理：`curl -x socks5h://172.17.0.1:7891 https://www.google.com -I`

Docker 插件代理地址：`socks5://172.17.0.1:7891`，支持 socks5h 时优先使用 `socks5h://172.17.0.1:7891`。
