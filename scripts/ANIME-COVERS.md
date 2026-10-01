# 追番封面缩略图

1. 环境依赖：Python 3 与 Pillow（需支持 WebP）。缺少 Pillow 时执行 `python3 -m pip install Pillow`。
2. `pnpm fetch-bangumi`、`pnpm process-bangumi -- input.json` 完成数据处理后自动执行缩略图生成；独立重建使用 `pnpm optimize:anime-covers`。
3. 脚本读取 `anime-data.json`，仅转换已下载的本地封面；原图保留。缩略图宽度最多 280px、保持比例，WebP 质量 82，文件名包含内容哈希，存于 `/data/covers/thumbs/`。
4. 数据追加 `thumbnail`、`thumbnailWidth`、`thumbnailHeight`、`coverWidth`、`coverHeight`；不改变收藏状态、顺序和 `lastUpdate`。
5. 追番时间轴优先加载缩略图；没有缩略图时使用原封面。关于页仍沿用原图。
6. 回归测试：`pnpm test:anime-covers`。同一数据重复转换不改变输出；旧缩略图不会自动删除，避免破坏已缓存的数据引用。
7. 本机部署不得直接调用含 `git reset --hard` 的部署脚本来发布未提交修改；先构建，再将 `src/.vuepress/dist/` 同步到已确认的静态目录。
