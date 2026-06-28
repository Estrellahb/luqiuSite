import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://www.mirekita.site",

  author: {
    name: "陆秋",
    email: "1050030743@qq.com",
  },

  docsDir: "src",

  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer:
    '<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">辽ICP备2026010002号-1</a>',
  displayFooter: true,

  // 博客相关
  blog: {
    name: "陆秋",
    avatar: "/assets/images/avatar.jpg",
    description: "写博客，记技术，也留下生活与追番里那些值得停留的片刻。",
    intro: "/about/",
    medias: {
      Bangumi: "https://bangumi.tv/user/757439",
      BiliBili: "https://space.bilibili.com/32760322",
      GitHub: "https://github.com/Estrellahb",
      Email: "mailto:1050030743@qq.com",
    },
    articleInfo: ["Date", "Category", "Tag", "ReadingTime", "Word"],
  },

  // 多语言配置
  metaLocales: {
    editLink: "编辑此页",
  },

  // 如果想要实时查看任何改变，启用它。注: 这对更新性能有很大负面影响
  // hotReload: true,

  markdown: {
    attrs: true,
    component: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    mark: true,
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,
    alert: true,
  },

  plugins: {
    blog: true,

    seo: {
      canonical: "https://www.mirekita.site",
    },

    slimsearch: {
      indexContent: true,
    },

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});
