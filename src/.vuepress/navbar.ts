import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "个人博客",
    icon: "book-open-reader",
    link: "/blog/",
  },
  {
    text: "技术笔记",
    icon: "laptop-code",
    link: "/tech/",
  },
  {
    text: "内容分享",
    icon: "compass-drafting",
    link: "/share/",
  },
  {
    text: "日常生活",
    icon: "mug-hot",
    link: "/life/",
  },
  {
    text: "追番记录",
    icon: "tv",
    link: "/anime/",
  },
  {
    text: "关于",
    icon: "user-large",
    link: "/about/",
  },
]);
