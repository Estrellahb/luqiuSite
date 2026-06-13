#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/luqiu-site"
DIST_DIR="$REPO_DIR/src/.vuepress/dist"
TARGET_DIR="/var/www/mirekita.site"
LOCK_FILE="/tmp/luqiu-site-deploy.lock"

cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "已有部署任务正在执行，退出。" >&2
  exit 1
fi

echo "[deploy] 构建 VuePress 静态文件..."
pnpm docs:build

echo "[deploy] 写入 .nojekyll..."
touch "$DIST_DIR/.nojekyll"

echo "[deploy] 同步到 nginx 静态目录：$TARGET_DIR"
rsync -av --delete "$DIST_DIR/" "$TARGET_DIR/"

echo "[deploy] 部署完成：$TARGET_DIR"
