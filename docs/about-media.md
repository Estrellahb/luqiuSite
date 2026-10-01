# 关于页媒体记录

关于页保留正文，并在末尾显示游戏与已看动画；每栏默认 8 项（4 列 × 2 行），可以独立展开、收起。窄屏改为上下排列。

## Steam 快照

在项目根目录被 Git 忽略的 `.env.local` 中配置 `STEAM_API_KEY`、17 位 `STEAM_ID`，或通过进程环境传入。游戏详情需要公开。

运行 `pnpm fetch-steam` 调用官方 GetOwnedGames，保留累计分钟数大于零的记录，按累计分钟数降序排列。生成 `src/.vuepress/public/data/steam-data.json`，不包含凭据或账户 ID。使用 600×900 竖版封面，失败尝试 Steam header，仍失败显示标题占位。

已有快照先备份到被忽略的 `backup/`，写入通过临时文件和原子重命名完成。请求失败、无游戏、无非零时长或数据格式异常均不覆盖旧快照。命令失败不会输出含凭据的请求 URL。

## Bangumi 快照

直接复用 `src/.vuepress/public/data/anime-data.json` 的 `watched`，按 `updatedAt` 的真实时间降序；缺失或无效日期排在末尾。此功能不会调用 Bangumi API，也不会改变现有同步方式。两种 JSON 均在构建时导入，SSR 即可输出默认卡片；构建不自动刷新数据。

验证：`pnpm test:about-media`、`pnpm docs:build`。生成数据变更后需重新构建。
