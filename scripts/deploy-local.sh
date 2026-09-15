#!/usr/bin/env bash
set -euo pipefail

# ----------------- 基础路径配置 -----------------
REPO_DIR="/home/ubuntu/luqiu-site"
BRANCH="main"
DIST_DIR="$REPO_DIR/src/.vuepress/dist"
TARGET_DIR="/var/www/mirekita.site"
LOCK_FILE="/tmp/luqiu-site-deploy.lock"

# ----------------- 1. 确保加载 nvm / node / pnpm 环境 -----------------
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$HOME/.nvm/nvm.sh"
  nvm use 22 >/dev/null 2>&1 || true
fi
export PATH="$HOME/.local/share/pnpm:$PATH"

cd "$REPO_DIR"

# ----------------- 2. 加载本地环境配置 -----------------
if [ -f "$REPO_DIR/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_DIR/.env.local"
  set +a
fi

# ----------------- 3. 部署排他锁（防止多实例并发冲突） -----------------
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[deploy] 已有部署任务正在执行，退出。" >&2
  exit 1
fi

# ----------------- 4. Git 远端拉取检测 -----------------
echo "[deploy] 正在检查远程仓库更新 ($BRANCH)..."
git fetch origin "$BRANCH"

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

# 检查是否传入了 --force 参数，若未传且哈希一致则跳过后续构建
FORCE_BUILD="${1:-}"
if [ "$FORCE_BUILD" != "--force" ] && [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  echo "[deploy] 本地代码已是最新 (${LOCAL_HASH:0:7})，无新提交，跳过构建。"
  echo "[deploy] (提示: 若需强制重新编译部署，可执行: $0 --force)"
  exit 0
fi

echo "[deploy] 发现新提交！准备拉取: ${LOCAL_HASH:0:7} -> ${REMOTE_HASH:0:7}"
# 使用 reset --hard 保证本地干净对齐远程主干，丢弃临时脏改动
git reset --hard "origin/$BRANCH"

echo "[deploy] 安装/更新项目依赖..."
pnpm install --frozen-lockfile

# ----------------- 5. 编译并打包 (已彻底跳过 Bangumi 追番数据抓取) -----------------
echo "[deploy] 构建 VuePress 静态文件 (pnpm docs:build)..."
export NODE_OPTIONS="--max_old_space_size=4096"
pnpm docs:build

echo "[deploy] 写入 .nojekyll..."
touch "$DIST_DIR/.nojekyll"

# ----------------- 6. 同步到 Nginx 静态目录 -----------------
echo "[deploy] 确保目标目录存在: $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"

echo "[deploy] 同步到 nginx 静态目录：$TARGET_DIR"
sudo rsync -av --delete "$DIST_DIR/" "$TARGET_DIR/"

# 规范化静态文件权限
sudo chown -R www-data:www-data "$TARGET_DIR" 2>/dev/null || true
sudo chmod -R 755 "$TARGET_DIR"

# ----------------- 7. 重载 Nginx -----------------
if command -v nginx &>/dev/null; then
  echo "[deploy] 验证并重载 Nginx..."
  if sudo nginx -t >/dev/null 2>&1; then
    sudo systemctl reload nginx
  else
    echo "[deploy] 警告: Nginx 语法测试未通过，跳过 reload！" >&2
  fi
fi

echo "[deploy] 🎉 部署成功！当前线上版本: $(git log -1 --pretty=format:'%h - %s (%cr)')"
