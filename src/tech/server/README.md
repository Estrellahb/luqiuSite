---
title: 服务器
icon: server
article: false
---

# 服务器

这组文章围绕个人站点和轻量服务部署展开，内容集中在域名接入、Nginx 入口层配置、HTTPS 证书和 Cloudflare 接入等常见主题。重点是把部署链路、配置方法和排查点写清楚。

<div class="section-grid">
  <a class="section-link-card" href="/tech/server/tencent-cloud-domain-to-cloudflare">
    <span>2026-05-10</span>
    <strong>把腾讯云服务器上的域名接入 Cloudflare</strong>
    <p>整理域名迁移到 Cloudflare 的完整流程，包括 DNS 检查、NS 切换和 SSL/TLS 设置。</p>
  </a>
  <a class="section-link-card" href="/tech/server/nginx-reverse-proxy-and-load-balancing">
    <span>2026-05-11</span>
    <strong>Nginx 反向代理与负载均衡配置说明</strong>
    <p>说明反向代理和负载均衡的作用，并给出 Nginx 的基础代理与 upstream 配置示例。</p>
  </a>
  <a class="section-link-card" href="/tech/server/cloudflare-free-ssl-certificate">
    <span>2026-05-11</span>
    <strong>在 Cloudflare 创建免费 SSL 证书方法</strong>
    <p>说明 Universal SSL 与 Origin Certificate 的区别，并给出源站证书创建与 Nginx 配置方法。</p>
  </a>
  <a class="section-link-card" href="/tech/server/nginx-reverse-proxy-certbot">
    <span>2026-05-26</span>
    <strong>Nginx 反向代理 + Certbot 自动签发 SSL 证书全流程</strong>
    <p>整理 Nginx 反向代理配置、Certbot 证书签发、HTTPS 重定向和自动续期检查流程。</p>
  </a>
</div>
