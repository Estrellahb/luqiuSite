---
title: Nginx 反向代理 + Certbot 自动签发 SSL 证书全流程
icon: shield-halved
date: 2026-05-26
category:
  - 技术笔记
tag:
  - Nginx
  - SSL
  - Certbot
---

# Nginx 反向代理 + Certbot 自动签发 SSL 证书全流程

给站点配上 Nginx 反向代理和 HTTPS，通常需要完成两件事：先把 Nginx 搭好作为统一入口，再申请 SSL 证书让站点走 HTTPS。本文把这两步串在一起，从零开始配完。

## 一、安装 Nginx

Ubuntu / Debian：

```bash
sudo apt update
sudo apt install nginx -y
```

安装完成后确认版本：

```bash
nginx -v
```

输出示例：

```
nginx version: nginx/1.18.0 (Ubuntu)
```

### 关于版本漏洞

近期 Nginx 出现了一个高危漏洞。如果版本低于 1.30，建议尽快升级。

## 二、先配一个基础的反向代理

假设后端服务运行在本机 `127.0.0.1:8317`，先创建一个站点配置文件：

```bash
sudo vim /etc/nginx/conf.d/example.com.conf
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

检查语法并重载：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

到这一步，站点已经可以通过 HTTP 访问了。

## 三、安装 Certbot 并申请 SSL 证书

安装 Certbot：

```bash
sudo apt install certbot python3-certbot-nginx -y
```

一条命令完成证书申请和 Nginx 自动配置。`-d` 后面换成你自己的域名：

```bash
sudo certbot --nginx -d example.com
```

同时为多个域名申请：

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

运行后的交互提示：

- **输入邮箱**：用于接收证书过期提醒。
- **同意服务条款**：输入 `A` 并按回车。
- **是否重定向**：选择 `2: Redirect`，Certbot 会自动添加 HTTP 到 HTTPS 的 301 跳转。

命令执行成功后，Nginx 配置会被自动更新，站点已经支持 HTTPS。

## 四、最终配置文件长这样

Certbot 运行完成后，`/etc/nginx/conf.d/example.com.conf` 会被更新成类似这样：

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:8317;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

各部分说明：

- 第一个 `server` 块：将 HTTP 80 端口的请求永久重定向到 HTTPS。
- 第二个 `server` 块：监听 443 端口，开启 SSL 和 HTTP/2。
- `ssl_certificate`：指向 Certbot 生成的完整证书链文件。
- `ssl_certificate_key`：指向证书私钥文件。
- `proxy_pass`：将请求转发到后端服务。

## 五、处理 conflicting server name 警告

检查 Nginx 配置时，可能出现以下警告：

```
nginx: [warn] conflicting server name "example.com" on 0.0.0.0:443, ignored
```

这是因为 Certbot 在默认站点配置文件 `sites-available/default` 里也写入了相同的 server 块。需要手动清理。

编辑默认配置：

```bash
sudo vim /etc/nginx/sites-available/default
```

先备份：

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
```

替换为最小站点配置：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    server_name _;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

完成后重载：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 六、验证证书状态

```bash
sudo certbot certificates
```

输出示例：

```
Found the following certs:
  Certificate Name: example.com
    Domains: example.com
    Expiry Date: 2026-08-24 12:00:00+00:00 (VALID: 89 days)
    Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
```

## 七、自动续期

Certbot 会自动配置续期定时任务。测试续期是否正常：

```bash
sudo certbot renew --dry-run
```

输出 `Congratulations, all renewals succeeded` 即表示自动续期已生效。

## 八、常见问题

### 证书申请时报错 DNS 验证失败

确保域名已经正确解析到当前服务器 IP，并且 80 端口可以正常访问。Certbot 申请证书时会验证域名所有权。

### 证书有效期多长

Let's Encrypt 签发的证书有效期为 90 天。Certbot 的自动续期机制会在到期前续期，不需要手动处理。

### 同一台服务器多个域名

多次执行 `certbot --nginx -d` 为不同域名申请证书即可，Certbot 会分别管理。
