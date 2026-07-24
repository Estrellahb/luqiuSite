import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/about/": ["/about/"],
  "/tech/": [
    {
      text: "技术笔记",
      icon: "laptop-code",
      collapsible: true,
      children: [
        "/tech/install-hermes-and-connect-feishu",
        "/tech/docker-plugin-socks5-proxy",
        "/tech/deploy-cli-proxy-api",
        "/tech/pi-custom-api-relay",
        "/tech/deploy-astrbot-with-docker-compose",
      ],
    },
    {
      text: "服务器",
      icon: "server",
      collapsible: true,
      children: [
        "/tech/server/tencent-cloud-domain-to-cloudflare",
        "/tech/server/nginx-reverse-proxy-and-load-balancing",
        "/tech/server/cloudflare-free-ssl-certificate",
        "/tech/server/nginx-reverse-proxy-certbot",
        "/tech/server/cloud-provider-firewall-rules",
        "/tech/server/sing-box-hysteria2-clash-verge",
      ],
    },
    {
      text: "电脑入门指南",
      icon: "desktop",
      collapsible: true,
      children: [
        "/tech/computer-guide/how-to-ask-questions",
        "/tech/computer-guide/buy-a-computer",
        "/tech/computer-guide/computer-hardware",
        "/tech/computer-guide/keyboard-and-screenshot",
        "/tech/computer-guide/trackpad-screen-and-cooling",
        "/tech/computer-guide/this-pc",
        "/tech/computer-guide/download-and-install",
        "/tech/computer-guide/download-from-cloud-drive",
        "/tech/computer-guide/uninstall",
        "/tech/computer-guide/shutdown-and-fast-startup",
        "/tech/computer-guide/recommended-apps",
        "/tech/computer-guide/search-engine",
        "/tech/computer-guide/browser-basics",
        "/tech/computer-guide/extract-archives",
      ],
    },
  ],
  "/life/": ["/life/"],
  "/anime/": ["/anime/"],
  "/projects/": [
    {
      text: "项目展示",
      icon: "code",
      children: [
        "/projects/",
        "/projects/what-to-eat-today",
        "/projects/universal-career-planning",
      ],
    },
  ],
});
