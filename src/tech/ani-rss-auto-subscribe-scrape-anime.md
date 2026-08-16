---
title: 使用ani rss自动订阅+刮削番剧
icon: film
date: 2026-08-15
category:
  - 技术笔记
tag:
  - ANI-RSS
  - Docker
  - qBittorrent
  - 番剧刮削
---

ANI-RSS 是一套基于 RSS 的番剧自动化管理工具，可以定时检查订阅源，将符合规则的任务推送到下载器，并在下载完成后自动重命名视频、整理目录和生成媒体库元数据。

本文使用 Docker Compose 同时部署 ANI-RSS 与 qBittorrent，完成从 RSS 更新、自动下载到 TMDB 元数据刮削的完整流程。示例路径适合 Linux 服务器和支持 Docker 的 NAS，实际目录可按存储结构调整。

::: caution 使用须知
ANI-RSS 只负责读取公开 RSS、处理种子链接和调用下载器。订阅与下载内容需要符合所在地法律法规，并确认资源来源具有合法授权。
:::

## 准备工作

开始部署前需要准备：

1. 一台已经安装 Docker 和 Docker Compose 的 Linux 服务器或 NAS。
2. 一个可用于保存配置文件的目录。
3. 一个用于存放番剧文件的媒体目录。
4. 可正常访问 RSS 源、Bangumi 和 TMDB 的网络环境。
5. 用于自动刮削的 TMDB API 密钥。

Compose 文件和程序配置放在当前用户的 `~/ani_rss` 目录中：

```text
~/ani_rss/
├── .env
├── compose.yaml
└── config/
    ├── ani-rss/
    └── qbittorrent/
```

番剧下载目录使用用户已有的媒体目录，不放在 `~/ani_rss` 中。例如：

```text
/home/username/Media/Anime
```

媒体目录也可以位于机械硬盘或 NAS 挂载点，例如 `/mnt/media/Anime`。实际绝对路径会写入 `.env`，并同时挂载到 ANI-RSS 和 qBittorrent 容器内的 `/Media`。

::: important 路径必须一致
ANI-RSS 与 qBittorrent 必须将同一个宿主机媒体目录映射为 `/Media`。路径不一致会导致自动跳过、重命名、自动删除和刮削功能异常。
:::

## 创建目录

创建项目目录和配置目录：

```bash
mkdir -p ~/ani_rss/config/ani-rss
mkdir -p ~/ani_rss/config/qbittorrent
```

媒体目录需要提前创建。以下路径仅作为示例，实际路径按本机存储位置调整：

```bash
mkdir -p ~/Media/Anime
```

通过以下命令查询当前用户的 UID 和 GID：

```bash
id -u
id -g
```

查询结果将在 `.env` 中使用。多数 Linux 系统创建的第一个普通用户，其 UID 和 GID 均为 `1000`；实际配置仍以命令输出为准。

## 编写环境变量

进入项目目录并创建 `.env`：

```bash
cd ~/ani_rss
vim .env
```

写入以下内容：

```dotenv
PUID=1000
PGID=1000
TZ=Asia/Shanghai
MEDIA_PATH=/home/username/Media/Anime
```

`PUID` 和 `PGID` 需要改成 `id -u`、`id -g` 的实际输出。`MEDIA_PATH` 需要填写番剧目录的实际绝对路径，例如：

```dotenv
MEDIA_PATH=/home/luqiu/Media/Anime
```

如果媒体目录位于机械硬盘或 NAS 挂载点，也可以填写：

```dotenv
MEDIA_PATH=/mnt/media/Anime
```

::: warning 媒体路径写法
`.env` 中的 `MEDIA_PATH` 不使用 `~`，需要填写完整绝对路径。该目录位于 `~/ani_rss` 外部，备份程序配置时不会把大量番剧文件一起打包。
:::

## 编写 Docker Compose 配置

在 `~/ani_rss` 中创建 Compose 文件：

```bash
vim compose.yaml
```

写入以下配置：

```yaml
services:
  ani-rss:
    image: wushuo894/ani-rss:latest
    container_name: ani-rss
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - UMASK=022
      - SERVER_PORT=7789
      - CONFIG=/config
      - TZ=${TZ}
      - SWAGGER_ENABLED=false
      - MCP_ENABLED=false
      - JAVA_OPTS=-Xms64m -Xmx512m -Xss256k -XX:+UseG1GC
    volumes:
      - ./config/ani-rss:/config
      - ${MEDIA_PATH}:/Media
    network_mode: host
    restart: unless-stopped

  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - UMASK=022
      - TZ=${TZ}
      - WEBUI_PORT=8080
    volumes:
      - ./config/qbittorrent:/config
      - ${MEDIA_PATH}:/Media
    network_mode: host
    restart: unless-stopped
```

这份配置使用 host 网络：

- ANI-RSS 管理页面端口为 `7789`。
- qBittorrent WebUI 端口为 `8080`。
- ANI-RSS 与 qBittorrent 共用 `.env` 中的 UID、GID、时区和媒体路径。
- 两个容器都将用户自己的番剧目录映射为 `/Media`。
- `~/ani_rss/config` 只保存 ANI-RSS 与 qBittorrent 的程序配置。

如果端口已被其他程序占用，需要修改 `SERVER_PORT` 或 `WEBUI_PORT`，并同步调整后续访问地址。

## qBittorrent 直接安装在 Linux

如果 qBittorrent 直接安装在 Linux 宿主机上，不需要在 Compose 中再次部署 qBittorrent。`compose.yaml` 只保留 ANI-RSS 服务：

```yaml
services:
  ani-rss:
    image: wushuo894/ani-rss:latest
    container_name: ani-rss
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - UMASK=022
      - SERVER_PORT=7789
      - CONFIG=/config
      - TZ=Asia/Shanghai
      - SWAGGER_ENABLED=false
      - MCP_ENABLED=false
      - JAVA_OPTS=-Xms64m -Xmx512m -Xss256k -XX:+UseG1GC
    volumes:
      - /u01/Docker_compose/ani-rss/config:/config
      - /mnt/disk2/amine:/Media
    network_mode: host
    restart: always
```

示例中的宿主机路径需要按实际目录修改：

1. `/u01/Docker_compose/ani-rss/config`：ANI-RSS 配置目录。
2. `/mnt/disk2/amine`：已有的番剧下载目录。

端口需要与宿主机 qBittorrent 的 WebUI 实际端口一致。qBittorrent 的下载目录必须对应宿主机上的 `/mnt/disk2/amine`，ANI-RSS 中的保存位置仍使用 `/Media/番剧/${title}/Season ${season}`。

::: tip 用户主目录无需提权
当 `compose.yaml`、`.env` 和 `config` 位于 `~/ani_rss` 时，创建目录、编辑文件和备份配置不需要使用 `sudo`。执行 Docker 命令是否需要 `sudo`，取决于当前用户是否已经加入 `docker` 用户组。
:::

## 启动容器

在 Compose 文件所在目录执行：

```bash
docker compose up -d
```

查看容器状态：

```bash
docker compose ps
```

当前用户没有 Docker 权限并出现 `permission denied` 时，再在 Docker 命令前增加 `sudo`。同时部署 ANI-RSS 与 qBittorrent 时，两个容器都应处于运行状态；使用宿主机 qBittorrent 方案时，只需确认 ANI-RSS 容器正常运行。启动失败时可以分别查看日志：

```bash
docker logs -f ani-rss
```

```bash
docker logs -f qbittorrent
```

## 登录 qBittorrent

浏览器访问：

```text
http://服务器IP:8080
```

qBittorrent 初次启动会为 `admin` 用户生成临时密码，可通过日志查询：

```bash
docker logs qbittorrent
```

在日志中找到临时密码后登录 WebUI，并尽快进入设置修改密码。

进入 qBittorrent 设置后，建议检查以下项目：

1. 开启 WebUI，并确认监听端口为 `8080`。
2. 勾选“为不完整的文件添加扩展名 `.!qB`”。
3. 配置“保存未完成的 torrent 到”，例如 `/Media/.incomplete`。
4. 做种限制达到条件后的操作设置为“停止任务”，不要让 qBittorrent 提前删除任务。
5. 确认默认保存路径和临时目录均已创建且具有写入权限。

## 登录 ANI-RSS

浏览器访问：

```text
http://服务器IP:7789
```

默认账号信息：

```text
用户名：admin
密码：admin
```

登录后先进入登录设置修改默认密码。如果管理页面需要通过公网访问，还需要配置防火墙、HTTPS 反向代理和访问控制，不建议直接将管理端口暴露到互联网。

## 连接 qBittorrent

1. 进入 qBittorrent 设置面板，打开 WebUI 并生成 API 密钥。
2. 在浏览器中打开 qBittorrent WebUI 地址，例如 `http://127.0.0.1:8080`。端口需要与 qBittorrent 的 WebUI 设置保持一致，登录后能够正常进入管理页面即可。
3. 进入 ANI-RSS 下载设置，选择 qBittorrent，将 WebUI 地址和 API 密钥填写到对应字段：

```text
下载工具：qBittorrent
地址：http://127.0.0.1:8080
apikey：qBittorrent WebUI 中生成的 API 密钥
保存位置：/Media/番剧/${title}/Season ${season}
剧场版保存位置：/Media/剧场版/${title}
```

ANI-RSS 和 qBittorrent 使用 host 网络时，可以通过 `127.0.0.1:8080` 建立连接。如果使用普通 Docker 网络，需要填写 qBittorrent 的容器服务名和对应端口。

4. 点击“测试”。页面显示“登录成功”，说明下载器连接正常。

下载器同时下载过多任务可能造成较高的磁盘和内存压力，可以将“同时下载限制”设置为 `3` 到 `5`。延迟下载也可以设置为约 30 分钟，具体数值按订阅源和下载需求调整。

## 配置自动重命名

进入基本设置中的重命名设置，开启“自动重命名”。推荐先使用接近默认规则的模板：

```text
[${subgroup}] ${title} S${seasonFormat}E${episodeFormat}
```

生成后的文件名类似：

```text
[ANi] 番剧名称 S01E01.mkv
```

模板中必须保留以下任意一种季集编号格式：

```text
S${seasonFormat}E${episodeFormat}
```

或：

```text
S${season}E${episode}
```

标准的 `S01E01` 命名便于 Emby、Jellyfin 等媒体服务器识别季度和集数。自动重命名不会破坏 BT 做种，ANI-RSS 会通过下载器接口处理文件名称与位置。

## 配置 TMDB 自动刮削

自动刮削会从 TMDB 获取海报、简介、演员信息和剧集元数据。进入“其他配置”，填写以下内容：

1. TMDB API 地址：保留默认地址，网络无法稳定访问时再改用可用的 API 镜像。
2. TMDB API 密钥：填写在 TMDB 申请的 API Key。
3. Bangumi Token：可选，用于补充 Bangumi 相关功能和部分受限条目信息。

随后进入“添加订阅配置”，开启以下选项：

1. `TMDB ID`：自动匹配作品对应的 TMDB ID。
2. `TMDB 标题`：使用 TMDB 中的标准标题。
3. `自动刮削`：订阅更新时自动获取并更新元数据。
4. `Bangumi 日语标题`：需要日文标题时开启。

::: warning TMDB 匹配检查
同名作品、重制版和多季度作品可能匹配到错误条目。保存订阅前需要检查 TMDB 标题、年份、TMDB ID 和季度信息，避免将元数据写入错误目录。
:::

## 配置 RSS 轮询

进入 RSS 设置并开启 RSS 总开关。轮询间隔以分钟为单位，订阅数量较少时可以设置为 `10` 到 `30` 分钟，订阅数量较多时适当延长，避免频繁请求源站。

建议开启以下功能：

1. 自动禁用订阅：根据 Bangumi 获取的总集数，在全部集数下载完成后自动停用订阅。
2. 遗漏检测：检查最小集数和最大集数之间是否缺集。
3. 摸鱼检测：周更番长时间没有更新时发送提醒。
4. 自动跳过：检测媒体目录中已经存在的剧集，避免重复下载。

“自动跳过”依赖自动重命名，并要求 ANI-RSS 与 qBittorrent 的挂载路径一致。需要自动洗版或下载 `v2`、`v3` 修正版时，应关闭自动跳过，再配合自动删除功能处理旧版本。

## 添加番剧订阅

建议先选择一部正在更新的番剧测试完整链路，确认正常后再批量添加。

进入“添加订阅”，填写：

1. 标题：用于后台识别和管理订阅。
2. TMDB：确认匹配到正确的作品。
3. BgmUrl：填写对应的 Bangumi 条目地址。
4. 主 RSS：填写番剧或字幕组提供的 RSS 地址。
5. 日期：填写番剧首播日期。
6. 季：填写媒体库中的季度编号。
7. 总集数：可由 Bangumi 获取，用于自动禁用订阅。
8. 匹配：只保留符合关键词或正则表达式的条目。
9. 排除：过滤不需要的分辨率、字幕组或版本。
10. 启用：开启当前订阅。

保存前可以预览 RSS 条目，重点检查标题、字幕组、分辨率和集数是否识别正确。集数识别异常时，可以为该订阅开启自定义集数规则，再根据源标题编写正则表达式。

一个基础匹配思路如下：

```text
匹配：1080P|1080p
排除：720P|2160P|繁日双语
```

匹配规则需要根据实际 RSS 标题调整。设置过严可能漏掉更新，设置过宽可能下载多个字幕组或不同清晰度的重复条目。

## 检查自动下载和刮削结果

订阅保存并开始轮询后，按以下顺序检查：

1. ANI-RSS 日志中已经读取到 RSS 条目。
2. 条目的标题、季度和集数识别正确。
3. qBittorrent 中出现对应下载任务。
4. 下载位置为 `/Media/番剧/作品名称/Season 1`。
5. 下载完成后，视频和字幕文件按模板重命名。
6. 番剧目录中已经生成海报、简介或 NFO 等刮削文件。
7. Emby 或 Jellyfin 扫描媒体库后能够识别作品、季度和集数。

可通过以下命令实时查看 ANI-RSS 日志：

```bash
docker logs -f ani-rss
```

如果媒体服务器没有及时显示新内容，可以手动扫描媒体库。目录结构与文件名正确但元数据仍然不匹配时，需要重新检查 TMDB ID、季度编号和剧集组。

## 常见问题

### 下载器测试失败

检查 qBittorrent WebUI 是否能够通过浏览器访问，并确认 ANI-RSS 中的地址、端口、用户名和密码正确。host 网络下可使用：

```text
http://127.0.0.1:8080
```

还需要确认 qBittorrent 没有限制 ANI-RSS 所在地址访问 WebUI。

### 下载任务提示权限错误

先查看 `.env` 配置和宿主机媒体目录权限：

```bash
cd ~/ani_rss
grep MEDIA_PATH .env
ls -ld /home/username/Media/Anime
```

`ls -ld` 后面的路径需要换成 `.env` 中 `MEDIA_PATH` 的实际值。容器中的 `PUID`、`PGID` 应与配置目录和媒体目录的所有者匹配。临时排查可以使用 root 身份运行容器，长期使用更适合设置明确的目录权限。

### 自动重命名不生效

检查以下项目：

1. 已开启自动重命名。
2. qBittorrent 版本满足 ANI-RSS 当前要求。
3. 重命名模板含有 `S${seasonFormat}E${episodeFormat}`。
4. ANI-RSS 与 qBittorrent 中的媒体路径都为 `/Media`。
5. 下载任务没有被 qBittorrent 提前删除。

### 自动跳过不生效

确认自动重命名已经开启，并检查两个容器的 `/Media` 是否指向同一个宿主机目录。即使宿主机目录相同，容器内部路径不同也会导致检测失败。

### RSS、Bangumi 或 TMDB 请求超时

ANI-RSS 的代理设置仅支持 HTTP 代理，可用于访问 Mikan、Bangumi、TMDB 和 Telegram。填写可用的 HTTP 代理地址后重新测试。

如果使用容器外的本机代理，需要确认代理监听地址允许容器或 host 网络访问。仅监听 `127.0.0.1` 的代理是否可用，取决于 ANI-RSS 当前使用的网络模式。

### TMDB 刮削结果错误

删除错误元数据前先核对订阅中的年份、TMDB 标题、TMDB ID、季和剧集组。修正匹配信息后重新执行刮削，并让媒体服务器刷新该作品的元数据。

### RSS 中存在条目但没有下载

检查订阅是否启用、RSS 总开关是否开启，并查看匹配、排除、全局排除和自动跳过规则。还需要确认源 RSS 本身包含目标集数。

## 更新容器

进入 Compose 目录执行：

```bash
cd ~/ani_rss
docker compose pull
docker compose up -d
```

确认更新后的容器状态：

```bash
docker compose ps
```

程序配置已经挂载到 `~/ani_rss/config`，重建容器不会删除这些数据。媒体文件位于 `.env` 指定的外部目录，需要按媒体库自身的备份策略管理。

更新前可以单独备份 ANI-RSS 与 qBittorrent 的部署文件和配置：

```bash
tar -czf ~/ani_rss-backup.tar.gz -C ~ ani_rss
```

该备份不包含 `.env` 指向的番剧目录。

## 参考资料

- [ANI-RSS Docker 部署](https://docs.wushuo.top/deploy/docker)
- [ANI-RSS 快速开始](https://docs.wushuo.top/start)
- [ANI-RSS 下载设置](https://docs.wushuo.top/config/download)
- [ANI-RSS 添加订阅](https://docs.wushuo.top/add-rss)
- [ANI-RSS 重命名设置](https://docs.wushuo.top/config/basic/rename)
- [ANI-RSS RSS 设置](https://docs.wushuo.top/config/basic/rss)
