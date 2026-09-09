---
title: 部署 CLI Proxy API 以及排坑日记
icon: terminal
date: 2026-05-26
category:
  - 技术笔记
tag:
  - 代理
  - Codex
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

---

## 五、模型请求返回 413 Request Entity Too Large

调用 OpenAI 兼容接口时，如果 `/v1/responses` 返回下面的错误，说明请求体超过了 Nginx 当前允许的大小：

```text
413 Request Entity Too Large
```

Nginx 没有显式配置 `client_max_body_size` 时，默认只允许约 `1 MB` 的请求体。普通文本对话可能不会触发限制，但长上下文、图片、Base64 数据、文件内容或大量工具调用信息都可能让请求体超过默认值。

错误由 Nginx 返回时，请求还没有进入后端中转服务。可以先在 Nginx 错误日志中确认：

```bash
sudo grep -E "client intended to send too large body| 413 " \
  /var/log/nginx/error.log \
  /var/log/nginx/access.log | tail -30
```

找到中转站域名对应的配置文件，在 HTTPS 的 `server` 块中加入请求体限制。下面以中转服务监听本机 `8317` 端口为例：

```nginx
server {
    listen 443 ssl http2;
    server_name proxy.example.com;

    ssl_certificate /etc/letsencrypt/live/proxy.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/proxy.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;

    # 放宽长上下文、图片和文件请求的大小限制
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 适配 Responses API 的流式响应和较长请求
        proxy_buffering off;
        proxy_cache off;
        proxy_request_buffering off;

        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

`client_max_body_size 100M;` 对长上下文、图片和常见文件请求通常已经足够。不建议直接设置为 `0`，因为这会取消请求体大小限制。

`proxy_request_buffering off;` 可以让 Nginx 在接收请求体时直接向后端转发，避免大请求完整写入临时文件。`proxy_buffering off;` 用于减少流式响应被 Nginx 缓冲的情况。

配置完成后先检查语法：

```bash
sudo nginx -t
```

只有出现下面两行结果时才能重新加载：

```text
syntax is ok
test is successful
```

重新加载并确认服务状态：

```bash
sudo systemctl reload nginx
systemctl is-active nginx
```

检查当前生效的中转站配置：

```bash
sudo nginx -T 2>&1 | grep -A40 "proxy.example.com"
```

确认输出中包含：

```nginx
client_max_body_size 100M;
proxy_request_buffering off;
proxy_buffering off;
proxy_read_timeout 600s;
```

再次发送原来的模型请求。如果 Nginx 日志中不再出现 413，但接口仍然提示请求过大，需要继续检查中转服务自身的请求体限制。