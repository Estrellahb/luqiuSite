import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/about/": ["/about/"],
  "/tech/": [
    {
      text: "技术笔记",
      icon: "laptop-code",
      collapsible: true,
      children: [
        "/tech/",
        "/tech/vuepress-content-organization.html",
        "/tech/component-naming-for-future-self.html",
        "/tech/building-boundaries-for-small-sites.html",
        "/tech/stable-markdown-writing-workflow.html",
      ],
    },
    {
      text: "服务器",
      icon: "server",
      collapsible: true,
      children: [
        "/tech/server/",
        "/tech/server/tencent-cloud-domain-to-cloudflare.html",
        "/tech/server/nginx-reverse-proxy-and-load-balancing.html",
        "/tech/server/cloudflare-free-ssl-certificate.html",
      ],
    },
    {
      text: "电脑入门指南",
      icon: "desktop",
      collapsible: true,
      children: [
        "/tech/computer-guide/",
        "/tech/computer-guide/how-to-ask-questions.html",
        "/tech/computer-guide/buy-a-computer.html",
        "/tech/computer-guide/computer-hardware.html",
        "/tech/computer-guide/keyboard-and-screenshot.html",
        "/tech/computer-guide/trackpad-screen-and-cooling.html",
        "/tech/computer-guide/this-pc.html",
        "/tech/computer-guide/download-and-install.html",
        "/tech/computer-guide/download-from-cloud-drive.html",
        "/tech/computer-guide/uninstall.html",
        "/tech/computer-guide/shutdown-and-fast-startup.html",
        "/tech/computer-guide/recommended-apps.html",
        "/tech/computer-guide/search-engine.html",
        "/tech/computer-guide/browser-basics.html",
        "/tech/computer-guide/extract-archives.html",
      ],
    },
  ],
  "/life/": ["/life/"],
  "/anime/": ["/anime/"],
  "/projects/": ["/projects/"],
});
