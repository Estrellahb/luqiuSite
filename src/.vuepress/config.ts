import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "陆秋",
  description: "在黑夜与紫罗兰之间，记录博客、技术、生活与追番。",

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["link", { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" }],
  ],

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
