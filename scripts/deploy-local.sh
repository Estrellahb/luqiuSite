#!/usr/bin/env bash
# ==============================================================================
# luqiu-site 本地/服务器自动化部署脚本
# 具备：并发排他锁、Git 远程检测与拉取、可选 Bangumi 数据抓取、
#       VuePress 生产构建、Nginx 静态目录同步与平滑重载。
# ==============================================================================
set -euo pipefail

# ----------------- 基础路径与配置 -----------------
REPO_DIR="${REPO_DIR:-/home/ubuntu/luqiu-site}"
BRANCH="${BRANCH:-main}"
DIST_DIR="$REPO_DIR/src/.vuepress/dist"
TARGET_DIR="${TARGET_DIR:-/var/www/mirekita.site}"
LOCK_FILE="/tmp/luqiu-site-deploy.lock"

# 默认行为配置（可通过命令行参数或环境变量覆盖）
# 默认跳过 Bangumi 数据拉取（加快日常部署），传入 --fetch-bangumi 启用抓取
SKIP_BANGUMI=true
FORCE_BUILD=false

# ----------------- 命令行参数解析 -----------------
usage() {
  cat <<EOF
用法: $(basename "$0") [选项]

选项:
  --skip-bangumi     跳过 Bangumi 追番数据抓取，直接编译代码（默认）
  --fetch-bangumi    强制执行 Bangumi 追番数据抓取与封面同步
  --force            即使本地与远程代码一致，也强制重新拉取并打包部署
  -h, --help         显示本帮助信息并退出

环境变量:
  REPO_DIR           Git 仓库根目录 (默认: /home/ubuntu/luqiu-site)
  BRANCH             部署分支 (默认: main)
  TARGET_DIR         Nginx 静态托管根目录 (默认: /var/www/mirekita.site)
  BANGUMI_TOKEN      Bangumi 个人 Access Token (若需抓取追番数据)
  HTTPS_PROXY        代理地址 (如需要: http://127.0.0.1:7890)

示例:
  $0                        # 正常检测更新，跳过 Bangumi 数据抓取并部署
  $0 --fetch-bangumi        # 检测更新并抓取最新追番数据
  $0 --force --fetch-bangumi # 强制拉取最新代码、抓取数据并全量重建
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-bangumi)
      SKIP_BANGUMI=true
      shift
      ;;
    --fetch-bangumi)
      SKIP_BANGUMI=false
      shift
      ;;
    --force)
      FORCE_BUILD=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "[deploy] 错误: 未知参数 '$1'，可使用 --help 查看支持的选项。" >&2
      exit 1
      ;;
  esac
done

# ----------------- 1. 确保加载 nvm / node / pnpm 环境 -----------------
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$HOME/.nvm/nvm.sh"
  nvm use 22 >/dev/null 2>&1 || true
fi

# 补充常见全局包管理器 PATH
export PATH="$HOME/.local/share/pnpm:$HOME/.local/bin:$HOME/bin:$PATH"

if ! command -v pnpm &>/dev/null; then
  echo "[deploy] 错误: 未找到 pnpm 命令，请确认 Node.js 与 pnpm 环境变量已配置。" >&2
  exit 1
fi

cd "$REPO_DIR"

# ----------------- 2. 加载本地环境配置 (.env.local) -----------------
if [ -f "$REPO_DIR/.env.local" ]; then
  echo "[deploy] 检测到 .env.local，正在加载本地环境变量..."
  set -a
  # shellcheck disable=SC1091
  source "$REPO_DIR/.env.local"
  set +a
fi

# ----------------- 3. 部署排他锁（防止多个脚本并发冲突） -----------------
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[deploy] 错误: 已有另一个部署任务正在执行中 (持有锁 $LOCK_FILE)，退出。" >&2
  exit 1
fi

# ----------------- 4. Git 远程更新检查与拉取 -----------------
echo "[deploy] 正在检查远程仓库更新 (分支: $BRANCH)..."
git fetch origin "$BRANCH"

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$FORCE_BUILD" = false ] && [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  echo "[deploy] 本地代码已是最新 (${LOCAL_HASH:0:7})，远程无新提交。"
  echo "[deploy] 若需强制重新编译部署，可传入: $0 --force"
  exit 0
fi

echo "[deploy] 准备对齐最新代码: ${LOCAL_HASH:0:7} -> ${REMOTE_HASH:0:7}"
# 使用 reset --hard 保证本地干净对齐远程，丢弃服务器上的临时脏改动
git reset --hard "origin/$BRANCH"

echo "[deploy] 安装/更新项目依赖 (pnpm install)..."
pnpm install --frozen-lockfile

# ----------------- 5. 可选执行 Bangumi 追番数据抓取 -----------------
if [ "$SKIP_BANGUMI" = false ]; then
  echo "[deploy] 正在拉取 Bangumi 追番数据 (pnpm fetch-bangumi)..."
  if pnpm fetch-bangumi; then
    echo "[deploy] 数据抓取完成，正在处理聚合数据 (pnpm process-bangumi)..."
    pnpm process-bangumi || echo "[deploy] 警告: process-bangumi 运行失败，将使用现有数据继续"
  else
    echo "[deploy] 警告: fetch-bangumi 拉取失败（网络波动或 Token 未配置），将使用现有数据继续构建"
  fi
else
  echo "[deploy] 已配置跳过 Bangumi 数据抓取 (--skip-bangumi)"
fi

# ----------------- 6. 编译并打包 VuePress 静态文件 -----------------
echo "[deploy] 开始构建 VuePress 生产静态资源..."
export NODE_OPTIONS="--max_old_space_size=4096"
pnpm docs:build

echo "[deploy] 生成 .nojekyll 防止静态资源下划线目录被过滤..."
touch "$DIST_DIR/.nojekyll"

# ----------------- 7. 同步到 Nginx 静态托管目录 -----------------
echo "[deploy] 确保目标目录存在: $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"

echo "[deploy] 正在同步构建产物至 Nginx 静态目录: $TARGET_DIR"
sudo rsync -av --delete "$DIST_DIR/" "$TARGET_DIR/"

# 规范化静态文件属主与权限，防止 Nginx 出现 403 Forbidden
sudo chown -R www-data:www-data "$TARGET_DIR" 2>/dev/null || true
sudo chmod -R 755 "$TARGET_DIR"

# ----------------- 8. 验证并平滑重载 Nginx -----------------
if command -v nginx &>/dev/null; then
  echo "[deploy] 正在测试 Nginx 语法..."
  if sudo nginx -t >/dev/null 2>&1; then
    echo "[deploy] Nginx 配置测试通过，正在平滑重载 (systemctl reload nginx)..."
    sudo systemctl reload nginx
  else
    echo "[deploy] 警告: Nginx 语法测试未通过，跳过 reload，请手动检查 Nginx 配置！" >&2
  fi
fi

# ----------------- 部署完成 -----------------
LATEST_COMMIT=$(git log -1 --pretty=format:'%h - %s (%cr)')
echo "================================================================="
echo "[deploy] 🎉 部署全流程圆满成功！"
echo "[deploy] 当前线上版本: $LATEST_COMMIT"
echo "[deploy] 访问目录: $TARGET_DIR"
echo "================================================================="
