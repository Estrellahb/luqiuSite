import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/about/": ["/about/"],
  "/guide/": [
    {
      text: "从零开始",
      icon: "seedling",
      link: "/guide/",
      children: [
        {
          text: "提问与解决",
          icon: "circle-question",
          collapsible: true,
          children: [
            "/guide/troubleshooting/ask-questions",
            "/guide/troubleshooting/search-engine",
            "/guide/troubleshooting/error-handling",
          ],
        },
        {
          text: "操作与软件",
          icon: "desktop",
          collapsible: true,
          children: [
            "/guide/operations/basic-operations",
            "/guide/operations/software-management",
          ],
        },
        {
          text: "网络与连接",
          icon: "network-wired",
          collapsible: true,
          children: [
            "/guide/network/browser-differences",
            "/guide/network/why-vpn-proxy",
          ],
        },
        {
          text: "版本控制 (Git & GitHub)",
          icon: "code-branch",
          collapsible: true,
          children: [
            "/guide/git/git-and-github-concept",
            "/guide/git/installation-and-auth",
            "/guide/git/basic-workflow",
            "/guide/git/remote-and-collaboration",
            "/guide/git/branch-and-conflict",
            "/guide/git/github-pull-request",
          ],
        },
        {
          text: "开发环境筑基",
          icon: "terminal",
          collapsible: true,
          children: [
            "/guide/env/terminal-and-cli-basics",
            "/guide/env/path-environment-variable",
            "/guide/env/runtime-and-interpreters",
            "/guide/env/workspace-and-package-manager",
          ],
        },
        {
          text: "软件工程全貌",
          icon: "diagram-project",
          collapsible: true,
          children: [
            "/guide/engineering/software-development-lifecycle",
            "/guide/engineering/programming-languages-overview",
            "/guide/engineering/developer-essential-tools",
          ],
        },
        {
          text: "AI 编程实战",
          icon: "wand-magic-sparkles",
          collapsible: true,
          children: [
            "/guide/ai-coding/paradigm-shift",
            "/guide/ai-coding/agent-concepts",
            "/guide/ai-coding/coding-agents-comparison",
            "/guide/ai-coding/agent-rules-and-skills",
            "/guide/ai-coding/modern-ai-engineering",
          ],
        },
      ],
    },
  ],
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
