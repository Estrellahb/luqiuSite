---
title: Nginx 反向代理与负载均衡配置说明
icon: server

date: 2026-05-11
category:
  - 技术笔记
tag:
  - 服务器
  - Nginx
  - 反向代理
  - 负载均衡
---

# Nginx 反向代理与负载均衡配置说明

Nginx 常用于 Web 服务入口层，负责接收客户端请求、转发动态流量、处理静态资源以及承接 HTTPS 连接。在单机部署场景中，Nginx 通常承担统一入口的职责；在多机部署场景中，Nginx 还可以继续承担上游调度任务。

## 为什么要配置 Nginx

业务应用直接监听 `3000`、`8080` 或其他端口对外提供服务时，部署层通常会出现几个共性问题。

### 入口不统一

业务服务通常监听应用端口，对外访问则更适合通过 `80` 或 `443` 统一接入。Nginx 可以接收域名请求，再将流量转发给真实服务进程。

### 业务服务不适合直接暴露

大部分应用框架侧重业务逻辑处理，入口治理能力通常需要由独立组件承担。常见入口治理任务包括：

- 静态文件缓存。
- Gzip 压缩。
- 请求限流。
- 黑白名单控制。
- 日志记录与拆分。

这些能力放在 Nginx 层统一处理，配置更集中，维护成本也更低。

### HTTPS 终止更方便

证书部署、`80` 到 `443` 的跳转、强制 HTTPS 和 TLS 参数管理，通常都由 Nginx 处理。后端应用只保留业务逻辑和应用协议处理即可。

### 给后端服务留出扩展空间

单机部署时，Nginx 负责统一入口。

服务扩容到多台机器后，Nginx 可以继续承担上游调度职责。入口层配置不需要随扩容方式整体重做。

## 什么是反向代理

**反向代理**是指客户端访问代理服务器，由代理服务器将请求转发给后端应用服务，再将结果返回给客户端。

大致流程是这样：

```text
浏览器 -> Nginx -> 应用服务
```

客户端通常不会直接访问后端服务地址或业务端口。

### 反向代理解决了什么问题

反向代理的核心作用是将入口层与业务层分离。

例如，Node.js 服务运行在 `127.0.0.1:3000`，外部访问入口使用 `https://example.com`。此时可以由 Nginx 监听 `80/443`，再将请求代理到 `3000` 端口。

这种配置通常带来以下收益：

- 隐藏后端真实地址和端口。
- 统一域名入口。
- 更方便接 HTTPS。
- 在代理层增加缓存、压缩、限流和访问控制。

### 它和正向代理有什么区别

- **正向代理**，代理的是客户端。
- **反向代理**，代理的是服务端。

Web 站点入口层配置中，Nginx 讨论的核心场景通常是反向代理。

## 什么是负载均衡

**负载均衡**是指在同一服务对应多个上游节点时，Nginx 按规则将请求分发到不同节点。

大致流程是这样：

```text
浏览器 -> Nginx -> 应用服务 A
                -> 应用服务 B
                -> 应用服务 C
```

如果没有负载均衡，所有请求会集中到单个节点。该节点负载升高时，响应时间会增加；节点故障时，服务可用性也会受到影响。

负载均衡的直接作用包括：

- **分摊流量压力**：多台机器一起扛请求。
- **提高可用性**：某一台出问题时，流量可以转到其他节点。

### 常见调度方式

Nginx 常见调度策略包括：

- **轮询**：默认方式，请求依次分配到每台机器。
- **weight**：按权重分配，机器性能强的可以给更高权重。
- **least_conn**：优先把请求给当前连接数更少的机器。
- **ip_hash**：同一个客户端 IP 尽量落到同一台机器，常用于会话粘性要求较强的场景。

## 详细配置方法

示例场景如下：

- 外部访问入口为 `example.com`。
- Nginx 作为前置入口层。
- 后端应用运行在本机 `3000` 端口。
- 后续可扩展为多台应用服务。

### 1. 安装 Nginx

Ubuntu / Debian：

```bash
sudo apt update
sudo apt install nginx -y
```

CentOS / Rocky / AlmaLinux：

```bash
sudo yum install nginx -y
```

安装完成后，先看版本：

```bash
nginx -v
```

常见路径一般是：

- 主配置：`/etc/nginx/nginx.conf`
- 站点配置目录：`/etc/nginx/conf.d/` 或 `/etc/nginx/sites-enabled/`
- 访问日志：`/var/log/nginx/access.log`
- 错误日志：`/var/log/nginx/error.log`

### 2. 先理解最小配置结构

Nginx 配置层级通常如下：

```nginx
events {}

http {
    server {
        listen 80;
        server_name example.com;

        location / {
        }
    }
}
```

- `http`：HTTP 相关总配置。
- `server`：一个站点或一个域名入口。
- `location`：具体路径匹配规则。

### 3. 配置一个最基础的反向代理

假设后端服务运行在本机 `127.0.0.1:3000`，站点配置可以写成：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

常见代理头说明如下：

- `Host`：向后端传递原始访问域名。
- `X-Real-IP`：传递客户端真实 IP。
- `X-Forwarded-For`：保留代理链路中的 IP 信息。
- `X-Forwarded-Proto`：告诉后端当前请求原始协议是 `http` 还是 `https`。

配置完成后，应先检查语法：

```bash
sudo nginx -t
```

语法检查通过后再重载：

```bash
sudo systemctl reload nginx
```

### 4. 如果站点里有静态资源，顺手拆开处理

静态资源通常由 Nginx 直接处理，无需全部转发给后端应用：

```nginx
server {
    listen 80;
    server_name example.com;

    location /static/ {
        alias /var/www/app/static/;
        expires 7d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

静态资源由 Nginx 直接返回后，后端服务的请求压力通常会下降。

### 5. 从反向代理扩展到负载均衡

当服务扩展为两台节点时：

- `192.168.1.10:3000`
- `192.168.1.11:3000`

对应配置可以先定义 `upstream`：

```nginx
upstream app_backend {
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

该配置默认采用轮询策略。请求会依次分配到不同的上游节点。

### 6. 常见负载均衡配置写法

#### 按权重分配

适用于机器配置不一致的场景：

```nginx
upstream app_backend {
    server 192.168.1.10:3000 weight=3;
    server 192.168.1.11:3000 weight=1;
}
```

该配置表示第一台机器承担更高比例的请求。

#### 最少连接数

适用于请求处理时长差异较大的场景：

```nginx
upstream app_backend {
    least_conn;
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
}
```

#### 按客户端 IP 固定落点

适用于需要一定会话粘性的场景：

```nginx
upstream app_backend {
    ip_hash;
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
}
```

如果会话状态仍保存在单机内存中，`ip_hash` 只能缓解部分问题。更稳定的方案是将会话状态存储到 Redis 这类共享存储中。

### 7. HTTPS 的常见写法

生产环境中，通常会将 `80` 端口请求跳转到 `443`：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;

    ssl_certificate /etc/ssl/example/fullchain.pem;
    ssl_certificate_key /etc/ssl/example/privkey.pem;

    location / {
        proxy_pass http://app_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

如果上文已经定义 `upstream app_backend`，这里可以直接复用该上游组。

### 8. 配完之后怎么验证

常见验证项包括以下内容。

#### 检查配置语法

```bash
sudo nginx -t
```

#### 检查服务状态

```bash
sudo systemctl status nginx
```

#### 看错误日志

```bash
sudo tail -f /var/log/nginx/error.log
```

#### 用 curl 验证响应头

```bash
curl -I http://example.com
curl -I https://example.com
```

#### 压测或多次访问观察负载均衡是否生效

如果后端接口可以返回机器标识，例如 `server-a`、`server-b`，连续访问后即可观察请求是否被分发到不同节点。

### 9. 常见问题

#### 访问返回 502 Bad Gateway

常见原因包括：

- 后端服务根本没启动。
- `proxy_pass` 写错了地址或端口。
- 后端只监听了内网地址，Nginx 连不上。
- 防火墙或安全组没放通对应端口。

#### 静态资源 404

这类问题通常与 `root` 和 `alias` 的使用混淆有关。路径映射错误时，Nginx 可以正常启动，但静态文件无法被正确定位。

#### 后端拿不到真实 IP

常见原因是未传递 `X-Real-IP` 或 `X-Forwarded-For`，或者应用框架未信任代理头。

#### 登录状态在多机下异常

负载均衡启用后，如果会话仍保存在单机内存中，请求分配到其他节点时，登录状态可能失效。该问题需要 Nginx 配置和应用层会话管理同时处理。

## 结语

Nginx 在 Web 架构中的核心职责包括统一入口、代理转发、静态资源处理和 HTTPS 承载。单机部署场景主要关注入口治理，多机部署场景则进一步关注请求分发和可用性控制。反向代理与负载均衡配置完善后，服务入口会更清晰，扩容路径也更稳定。

## 参考链接

- [为什么要用 Nginx](https://www.nginx.org.cn/article/detail/545)
- [Nginx 反向代理与负载均衡概念](https://www.nginx.org.cn/article/detail/214)
