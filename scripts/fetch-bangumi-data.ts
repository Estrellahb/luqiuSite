/**
 * Bangumi 追番进度同步 — 数据拉取脚本
 *
 * 从 Bangumi v0 API 拉取用户追番数据，下载封面图到本地，
 * 写入 src/.vuepress/public/data/anime-data.json 供 VuePress 组件读取。
 *
 * 用法:
 *   BANGUMI_TOKEN=xxx tsx scripts/fetch-bangumi-data.ts
 *
 * 代理:
 *   脚本使用 Node.js 内置 fetch，自动读取 HTTPS_PROXY / https_proxy 环境变量。
 *   例: HTTPS_PROXY=http://127.0.0.1:7890 tsx scripts/fetch-bangumi-data.ts
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── 类型定义 ────────────────────────────────────────────────

interface BangumiSubject {
  id: number;
  name: string;
  name_cn: string;
  images?: {
    large?: string;
    common?: string;
    medium?: string;
  };
  eps?: number;
  total_episodes?: number;
  rating?: { score: number };
  score?: number;
  short_summary?: string;
  summary?: string;
  date?: string;          // e.g. "2024-01-05"
  platform?: string;      // e.g. "TV"
  collection_total?: number;
  type?: number;           // 2 = 动画
}

interface BangumiCollectionItem {
  subject_id: number;
  subject: BangumiSubject;
  ep_status?: number;
  rate?: number;
  comment?: string;
  updated_at?: string;
}

interface BangumiV0Response {
  data: BangumiCollectionItem[];
  total: number;
  limit: number;
  offset: number;
}

interface AnimeItem {
  id: string;
  title: string;
  originalTitle: string;
  cover: string;
  url: string;
  status: "want" | "watching" | "watched";
  total: number | undefined;
  progress: number | undefined;
  score: number | undefined;
  myScore: number | undefined;
  desc: string;
  airDate: string;
  type: string;
  comment: string | undefined;
  updatedAt: string | undefined;
}

interface AnimeData {
  watching: AnimeItem[];
  watched: AnimeItem[];
  want: AnimeItem[];
  lastUpdate: string;
}

// ─── 配置 ────────────────────────────────────────────────────

const BANGUMI_TOKEN = process.env.BANGUMI_TOKEN ?? "";
const API_BASE = "https://api.bgm.tv";
const OUTPUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  ".vuepress",
  "public",
  "data",
);
const COVERS_DIR = resolve(OUTPUT_DIR, "covers");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "anime-data.json");

const LIMIT = 50;  // API 最大每页 50 条

// ─── 工具函数 ────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[bangumi-sync] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[bangumi-sync] ⚠ ${msg}`);
}

function error(msg: string) {
  console.error(`[bangumi-sync] ✗ ${msg}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 安全截取字符串（简介可能很长） */
function truncate(s: string | undefined, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ─── API 调用 ────────────────────────────────────────────────

async function bangumiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  log(`GET ${url}`);

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${BANGUMI_TOKEN}`,
      Accept: "application/json",
      "User-Agent": "luqiu-bangumi-sync/0.1.0",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "(无法读取响应体)");
    throw new Error(
      `API 返回 HTTP ${resp.status} ${resp.statusText}\n${truncate(body, 500)}`,
    );
  }

  return resp.json() as Promise<T>;
}

/** 拉取某一状态的全部收藏（自动翻页） */
async function fetchAllCollections(
  type: number, // 1=wish, 3=do, 2=collect
): Promise<BangumiCollectionItem[]> {
  const all: BangumiCollectionItem[] = [];
  let offset = 0;
  let total = Infinity;

  while (all.length < total) {
    const data = await bangumiFetch<BangumiV0Response>(
      `/v0/users/-/collections?subject_type=2&type=${type}&limit=${LIMIT}&offset=${offset}`,
    );
    all.push(...data.data);
    total = data.total;
    offset += LIMIT;

    log(`  已拉取 ${all.length}/${total} 条 (type=${type})`);

    // 防止触发频率限制
    if (offset < total) await sleep(200);
  }

  return all;
}

// ─── 封面下载 ────────────────────────────────────────────────

async function downloadCover(
  subjectId: string,
  url: string,
): Promise<string> {
  const ext = url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] ?? "jpg";
  const filename = `${subjectId}.${ext}`;
  const filepath = resolve(COVERS_DIR, filename);
  const publicPath = `/data/covers/${filename}`;

  // 已有缓存，跳过
  if (existsSync(filepath)) {
    log(`  封面已缓存: ${filename}`);
    return publicPath;
  }

  try {
    log(`  下载封面: ${url}`);
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "luqiu-bangumi-sync/0.1.0",
      },
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const buffer = Buffer.from(await resp.arrayBuffer());
    await writeFile(filepath, buffer);
    log(`  封面已保存: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return publicPath;
  } catch (err) {
    warn(`  封面下载失败 ${subjectId}: ${err}`);
    // 保留远程 URL 作为回退
    return url;
  }
}

// ─── 数据转换 ────────────────────────────────────────────────

const STATUS_MAP: Record<number, "want" | "watching" | "watched"> = {
  1: "want",
  3: "watching",
  2: "watched",
};

const TYPE_LABELS: Record<number, string> = {
  1: "书籍",
  2: "动画",
  3: "音乐",
  4: "游戏",
  6: "三次元",
};

function mapItem(
  item: BangumiCollectionItem,
  status: "want" | "watching" | "watched",
): AnimeItem {
  const s = item.subject;

  return {
    id: String(item.subject_id),
    title: s.name_cn || s.name,
    originalTitle: s.name_cn ? s.name : "",
    cover: s.images?.large ?? s.images?.common ?? s.images?.medium ?? "",
    url: `https://bgm.tv/subject/${item.subject_id}`,
    status,
    total: s.eps ?? s.total_episodes ?? item.ep_status ?? undefined,
    progress: item.ep_status ?? undefined,
    score: s.rating?.score ?? s.score ?? undefined,
    myScore: item.rate ?? undefined,
    desc: truncate(s.short_summary ?? s.summary, 300),
    airDate: s.date ?? "",
    type: s.platform || TYPE_LABELS[s.type ?? 2] || "",
    comment: item.comment ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  };
}

// ─── 主流程 ──────────────────────────────────────────────────

async function main() {
  if (!BANGUMI_TOKEN) {
    error("缺少 BANGUMI_TOKEN 环境变量。\n用法: BANGUMI_TOKEN=xxx tsx scripts/fetch-bangumi-data.ts");
    process.exit(1);
  }

  // 验证 token
  log("验证 Bangumi 身份…");
  try {
    const me = await bangumiFetch<{ username: string; nickname: string }>("/v0/me");
    log(`已认证: @${me.username} (${me.nickname})`);
  } catch (err) {
    error(`Token 验证失败: ${err}`);
    process.exit(1);
  }

  // 拉取数据
  log("拉取追番数据…");
  const [wantRaw, watchingRaw, watchedRaw] = await Promise.all([
    fetchAllCollections(1),  // 想看
    fetchAllCollections(3),  // 在看
    fetchAllCollections(2),  // 看过
  ]);

  const want = wantRaw.map((i) => mapItem(i, "want"));
  const watching = watchingRaw.map((i) => mapItem(i, "watching"));
  const watched = watchedRaw.map((i) => mapItem(i, "watched"));

  log(
    `数据拉取完成: 想看 ${want.length}, 在追 ${watching.length}, 补完 ${watched.length}`,
  );

  // 下载封面
  log("下载封面图…");
  await mkdir(COVERS_DIR, { recursive: true });

  let coverCount = 0;
  for (const item of [...watching, ...watched, ...want]) {
    if (item.cover && (item.cover.startsWith("http://") || item.cover.startsWith("https://"))) {
      const localPath = await downloadCover(item.id, item.cover);
      if (localPath.startsWith("/data/")) coverCount++;
      item.cover = localPath;
    }
  }
  log(`封面处理完成: ${coverCount} 张已本地化`);

  // 写入 JSON
  const output: AnimeData = {
    watching,
    watched,
    want,
    lastUpdate: new Date().toISOString(),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  log(`数据已写入: ${OUTPUT_FILE} (${watching.length + watched.length + want.length} 条)`);
  log("完成 ✓");
}

main().catch((err) => {
  error(String(err));
  process.exit(1);
});
