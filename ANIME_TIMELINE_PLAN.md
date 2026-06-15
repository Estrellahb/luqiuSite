# 追番时间轴页面方案文档

> 2026-06-15 根据 astro-bangumi 参考重写

## 目标

追番板块扩展为独立的追番时间轴页面，按年份、月份由新到旧展示番剧记录。数据来源于 Bangumi API（用户提供 token），卡片样式参考 `astro-bangumi` npm 包的横向布局（左封面、右信息），封面图本地化缓存以保证国内访问稳定。

## 当前项目基础

- 项目目录：`/home/ubuntu/luqiu-site`
- 框架：VuePress 2 + Vite
- 主题：`vuepress-theme-hope`
- 追番入口：`src/anime/README.md`
- 当前追番路由：`/anime/`
- 全局样式文件：`src/.vuepress/styles/index.scss`
- 构建命令：`pnpm docs:build`
- 本机部署静态目录：`/var/www/mirekita.site/`

## astro-bangumi 参考分析

`astro-bangumi`（npm 包，v1.0.0）是 Astro 集成，支持从 Bilibili 和 Bangumi.tv v0 API 拉取追番数据并渲染卡片。核心资产：

### 卡片布局（可直接适配到 VuePress）

```
┌──────────────────────────────────────────────┐
│ ┌──────────┐  标题                    [番剧] │
│ │          │  类型  TV    总话数  12         │
│ │  封面    │  追番人数  1.2万    评分  8.5   │
│ │  100px   │  简介：一段描述文字...          │
│ └──────────┘                                │
└──────────────────────────────────────────────┘
```

关键样式参数：

- 容器：`display: flex`，水平排列，`padding: 15px 0`，底部 1px 分隔线
- 封面：`flex-shrink: 0`，`width: 100px`，`border-radius: 4px`，`margin-right: 15px`
- 标题：`font-size: 17px`，`font-weight: 600`，hover 变蓝色（`#00a1d6`）
- 元信息：小药丸样式，`padding: 4px 10px`，`border-radius: 12px`，灰色背景
- 移动端：封面缩至 80px

### Bangumi v0 API 集成

```ts
// 路径：api.bgm.tv/v0/users/{username}/collections
// 参数：subject_type=2（动漫），type=1(wish)/3(do)/2(collect)
// 每页 50 条，自动翻页拉取全部
// 不需要 token（公开数据），但用户可能提供 token 用于鉴权或更高频调用
```

### 数据处理流程

```
Bangumi API → fetchAllBangumiV0() → 合并本地 JSON → 写入 bangumi-data.json → 组件读取渲染
```

## 适配到 VuePress 的方案

`astro-bangumi` 无法直接用于 VuePress，但以下部分可以直接复用：

- **Bangumi API 调用逻辑**：`fetchBangumiV0` / `fetchAllBangumiV0` 函数
- **卡片 HTML 结构和 CSS**：横向 flex 布局、小药丸标签、分隔线样式
- **分页和 Tab 逻辑**：想看 / 在看 / 看过 三 Tab 切换

需要重写的部分：

- Astro 集成钩子 → VuePress 构建钩子或独立脚本
- `.astro` 组件 → Vue SFC 组件
- Astro CSS 变量 → luqiu.site 现有的 `--lu-*` 变量体系

## 文件方案

### 需要新增的文件

- `src/.vuepress/data/anime-records.ts`
  - 导入预生成的 JSON 数据，添加按年/月分组的计算属性
  - 也可以直接读取 `public/data/anime-data.json`

- `src/.vuepress/components/AnimeTimeline.vue`
  - Vue 组件，读取数据，按年/月分组渲染时间轴
  - 卡片结构采用 astro-bangumi 的横向 flex 布局

- `scripts/fetch-bangumi-data.ts`（或 `.mjs`）
  - 构建前执行的独立脚本
  - 调用 Bangumi v0 API（`api.bgm.tv`），拉取用户追番数据
  - 写入 `src/.vuepress/public/data/anime-data.json`

- `src/anime/assets/covers/`
  - 存放本地缓存的封面图
  - 脚本拉取时同时下载封面并替换 URL 为本地路径

### 需要修改的文件

- `src/anime/README.md`
  - 保留 frontmatter
  - 正文改为栏目说明 + `<AnimeTimeline />`

- `package.json`
  - 新增 `scripts.fetch-bangumi` 命令

### 暂不修改的文件

- `src/.vuepress/navbar.ts` — 追番入口已存在
- `src/.vuepress/sidebar.ts` — 单页不需要侧边栏
- `src/.vuepress/theme.ts` — 不需要额外配置

## 数据结构设计

预生成的数据文件 `public/data/anime-data.json` 结构（参考 astro-bangumi）：

```json
{
  "watching": [
    {
      "id": "subject_12345",
      "title": "葬送的芙莉莲",
      "originalTitle": "葬送のフリーレン",
      "cover": "/data/covers/12345.webp",
      "url": "https://bgm.tv/subject/12345",
      "status": "watching",
      "total": 28,
      "progress": 12,
      "score": 8.5,
      "myScore": 9,
      "desc": "打败魔王后的勇者一行人的故事。",
      "airDate": "2023-10-01",
      "type": "TV",
      "tags": ["奇幻", "冒险"]
    }
  ],
  "watched": [],
  "want": [],
  "lastUpdate": "2026-06-15T10:00:00.000Z"
}
```

TypeScript 类型定义（`anime-records.ts`）：

```ts
export interface AnimeItem {
  id: string;
  title: string;
  originalTitle?: string;
  cover: string;          // 本地路径
  url?: string;           // Bangumi 条目链接
  status: "want" | "watching" | "watched";
  total?: number;         // 总集数
  progress?: number;      // 观看进度
  score?: number;         // Bangumi 评分
  myScore?: number;       // 个人评分
  desc?: string;
  airDate?: string;       // 播出日期，用于推导年份和月份
  type?: string;          // TV / OVA / 剧场版 / WEB
  tags?: string[];
}

export interface AnimeData {
  watching: AnimeItem[];
  watched: AnimeItem[];
  want: AnimeItem[];
  lastUpdate: string;
}
```

## 组件实现方案

组件路径：`src/.vuepress/components/AnimeTimeline.vue`

核心逻辑：

- 从 `public/data/anime-data.json` 读取预生成数据
- 合并 `watching` / `watched` / `want` 三个列表
- 按 `airDate` 推导年份和月份
- 按年 → 月 → sortDate 倒序分组
- Tab 切换：在追 / 补完 / 想看

组件结构（元素级别参考 astro-bangumi 的 Bangumi.astro）：

```
AnimeTimeline
├── tabs: [想看(n)] [在追(n)] [补完(n)]
├── YearGroup (倒序)
│   └── MonthGroup (倒序)
│       └── AnimeCard (flex 横向)
│           ├── .anime-card-cover (100px, flex-shrink: 0)
│           │   └── img (border-radius: 12px, object-fit: cover)
│           └── .anime-card-info (flex: 1)
│               ├── .anime-card-title (标题 + Bangumi 链接)
│               ├── .anime-card-meta (类型/集数/评分 小药丸)
│               └── .anime-card-desc (简介, 2行截断)
```

关键样式（适配 luqiu.site CSS 变量）：

- 卡片背景：`var(--lu-surface-strong)`
- 卡片边框：`1px solid var(--lu-border)`
- 卡片圆角：`24px`（桌面）/ `20px`（移动）
- hover：`box-shadow` 加深 + `translateY(-2px)`
- 标题颜色：`var(--lu-ink)`
- 元信息药丸：参考 astro-bangumi 的 `padding: 4px 10px; border-radius: 12px; background: var(--lu-bg-secondary)`
- 分隔线：卡片底部 1px solid `var(--lu-border)`

## 数据同步方案

### 构建时同步（推荐初版）

```
pnpm fetch-bangumi  →  拉取 API 数据  →  写入 public/data/anime-data.json  →  pnpm docs:build
```

`scripts/fetch-bangumi-data.ts` 脚本逻辑（参考 astro-bangumi）：

```ts
// 1. 读取用户配置（Bangumi username / token）
// 2. 调用 api.bgm.tv/v0/users/{username}/collections
//    分别拉取 type=1(wish), type=3(do), type=2(collect)
// 3. 下载封面图到 public/data/covers/
// 4. 替换 cover URL 为本地路径
// 5. 写入 public/data/anime-data.json
```

执行命令：

```bash
pnpm fetch-bangumi && pnpm docs:build
```

### 部署流程

```bash
# 1. 拉取最新 Bangumi 数据
pnpm fetch-bangumi

# 2. 构建 VuePress
pnpm docs:build

# 3. 部署到静态目录
touch src/.vuepress/dist/.nojekyll
rsync -av --delete src/.vuepress/dist/ /var/www/mirekita.site/
```

## 初版执行步骤

### 阶段一：数据脚本

1. 创建 `scripts/fetch-bangumi-data.ts`
2. 实现 Bangumi v0 API 调用（参考 astro-bangumi 的 `fetchAllBangumiV0`）
3. 实现封面下载与路径替换
4. 写入 `public/data/anime-data.json`
5. 添加 `package.json` scripts：`"fetch-bangumi": "tsx scripts/fetch-bangumi-data.ts"`

### 阶段二：组件开发

1. 新增 `src/.vuepress/components/AnimeTimeline.vue`
   - 从 `public/data/anime-data.json` 读取数据
   - 按年/月分组、按 Tab 筛选
   - astro-bangumi 风格的横向卡片
2. 修改 `src/anime/README.md`，插入 `<AnimeTimeline />`
3. 构建测试：`pnpm docs:build`

### 阶段三：样式完善

1. Tab 栏样式（想看/在追/补完，参考 astro-bangumi 的 `.bangumi-tabs`）
2. 年份/月份标题样式
3. 移动端适配
4. 深色模式适配

### 阶段四：本机预览与部署

## 验收标准

初版完成后需要满足：

- `/anime/` 页面能正常打开
- Tab 切换：想看、在追、补完三个视图正常切换
- 年份按由新到旧排序，月份按由新到旧排序
- 卡片为横向 flex 布局：左封面 ~100px，右信息区
- 每个卡片展示：标题、类型、集数、评分、简介
- 封面图来自本地路径，不依赖 Bangumi CDN
- 移动端正常显示
- 深色模式可读
- `pnpm docs:build` 通过

## 待确认事项

1. Bangumi 认证方式
   - 方案 A：仅使用 username 访问公开数据（v0 API 默认不需要 token）
   - 方案 B：用户提供 token 用于更高频调用或访问私有数据

2. 封面图方案
   - 方案 A：脚本拉取时自动下载到本地（推荐，彻底脱离 Bangumi CDN）
   - 方案 B：使用 `coverMirror` 代理 Bangumi CDN 图片
   - 方案 C：保留原始 URL 但不保证国内可访问

3. 卡片展示字段
   - 方案 A：标题 + 类型 + 集数 + 评分 + 简介（与 astro-bangumi 一致）
   - 方案 B：方案 A + 个人评分 + 个人备注
   - 方案 C：方案 B + 标签

4. 替换 astro-bangumi 的 `#00a1d6` 主色为站点现有 `--lu-accent-strong`（紫蓝），保持一致
   - 建议：采用方案 A，保持站点视觉统一
