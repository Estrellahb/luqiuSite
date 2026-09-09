import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "从零开始",
    icon: "seedling",
    link: "/guide/",
  },
  {
    text: "技术笔记",
    icon: "laptop-code",
    link: "/tech/deploy-cli-proxy-api.html",
  },
  {
    text: "生活分享",
    icon: "mug-hot",
    link: "/life/",
  },
  {
    text: "追番记录",
    icon: "tv",
    link: "/anime/",
  },
  {
    text: "项目展示",
    icon: "code",
    link: "/projects/",
  },
  {
    text: "关于",
    icon: "user-large",
    link: "/about/",
  },
]);
