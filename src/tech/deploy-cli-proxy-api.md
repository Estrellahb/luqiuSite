---
title: 部署 CLI Proxy API 以及排坑日记
icon: terminal
date: 2026-05-26
category:
  - 技术笔记
tag:
  - 服务器
  - 代理
  - Codex
  - Nginx
  - Docker
---

# 部署 CLI Proxy API 以及排坑日记

## 设备与环境

- 机型：美西 1h1g VPS
- 线路：回程优化

参考教程：
https://help.router-for.me/cn/hands-on/tutorial-5.html

---

## 一、Docker 安装命令修复

教程文档里的 Docker 安装命令是 md 格式的，直接复制粘贴可能会跑不起来。

正确命令应该是：

```bash
sudo bash <(curl -fsSL https://get.docker.com)
```

或者更稳一点，分两步执行：

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo bash get-docker.sh
```

两步执行的好处是，如果下载遇到网络波动，可以重新跑第二句，不用再下载一次。

---

## 二、在本地建立 SSH 隧道

如果已经生成过 SSH 密钥，建立隧道时记得把私钥的路径也写进去。

例如：

```bash
ssh -i "C:\Users\Administrator\.ssh\mykey.pem" -L 1455:127.0.0.1:1455 root@192.123.123.123 -p 53111
```

各参数说明：

- `-i`：指定私钥文件路径。如果使用默认路径（如 `~/.ssh/id_rsa`），可以省略，否则必须指定。
- `-L`：本地端口转发，格式为 `本地端口:目标地址:目标端口`。
- `-p`：SSH 服务端端口，默认为 22，如果服务端改了端口则需要指定。

---

## 三、Codex 配置域名访问问题

配置 Codex 用域名访问 API 时，记得在请求域名后面加上 `/v1`。

例如 `https://your-domain.com/v1`

否则会返回 404。

---

## 四、请求超过 1 分钟就 500 阻断

部署后遇到一个问题：请求处理时间超过 1 分钟时，Nginx 会主动断开连接，返回 500。

这是因为 Nginx 默认的超时配置较短，需要修改 `nonstream-keepalive-interval` 参数。

只需要在 Nginx 配置中加入：

```nginx
nonstream-keepalive-interval = 20
```

如果问题仍然存在，还可以同时检查以下 Nginx 超时相关配置：

```nginx
proxy_connect_timeout   300;
proxy_send_timeout      300;
proxy_read_timeout      300;
```

调整后重载 Nginx 即可。

```bash
sudo nginx -t
sudo systemctl reload nginx
```
