import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/about/": ["/about/"],
  "/blog/": [
    {
      text: "个人博客",
      icon: "book-open-reader",
      collapsible: true,
      children: [
        "/blog/",
        "/blog/why-i-started-blogging.html",
        "/blog/writing-better-paragraphs.html",
        "/blog/consistency-over-weekly-updates.html",
        "/blog/website-publishing-checklist.html",
      ],
    },
  ],
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
  "/share/": [
    {
      text: "内容分享",
      icon: "compass-drafting",
      collapsible: true,
      children: [
        "/share/",
        "/share/building-the-first-layer-of-site-style.html",
        "/share/homepage-is-an-entry-not-a-resume.html",
        "/share/whitespace-rhythm-and-readability.html",
        "/share/blog-color-should-serve-content.html",
      ],
    },
  ],
  "/life/": ["/life/"],
  "/anime/": ["/anime/"],
});
