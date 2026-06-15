#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/luqiu-site"
DIST_DIR="$REPO_DIR/src/.vuepress/dist"
TARGET_DIR="/var/www/mirekita.site"
LOCK_FILE="/tmp/luqiu-site-deploy.lock"

cd "$REPO_DIR"

if [ -f "$REPO_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_DIR/.env.local"
  set +a
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "已有部署任务正在执行，退出。" >&2
  exit 1
fi

if [ "${SKIP_BANGUMI_FETCH:-}" = "1" ]; then
  echo "[deploy] SKIP_BANGUMI_FETCH=1，跳过 Bangumi 数据拉取。"
else
  echo "[deploy] 拉取 Bangumi 追番数据..."
  if [ -n "${BANGUMI_TOKEN:-}" ]; then
    pnpm fetch-bangumi
  else
    echo "[deploy] 未设置 BANGUMI_TOKEN，跳过 Bangumi 数据拉取。"
  fi
fi

echo "[deploy] 构建 VuePress 静态文件..."
pnpm docs:build

echo "[deploy] 写入 .nojekyll..."
touch "$DIST_DIR/.nojekyll"

echo "[deploy] 同步到 nginx 静态目录：$TARGET_DIR"
rsync -av --delete "$DIST_DIR/" "$TARGET_DIR/"

echo "[deploy] 部署完成：$TARGET_DIR"
