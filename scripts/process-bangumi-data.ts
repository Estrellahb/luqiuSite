/**
 * Bangumi 追番数据处理脚本
 *
 * 输入由外部环境拉取的 Bangumi collections 原始 JSON，下载封面图并写入
 * src/.vuepress/public/data/anime-data.json 供 VuePress 组件读取。
 *
 * 用法：
 *   pnpm process-bangumi -- input.json
 *
 * input.json 格式：
 * {
 *   "want": [BangumiCollectionItem],
 *   "watching": [BangumiCollectionItem],
 *   "watched": [BangumiCollectionItem]
 * }
 */

import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
  date?: string;
  platform?: string;
  type?: number;
}

interface BangumiCollectionItem {
  subject_id: number;
  subject: BangumiSubject;
  ep_status?: number;
  rate?: number;
  comment?: string;
  updated_at?: string;
}

interface RawBangumiData {
  want?: BangumiCollectionItem[];
  watching?: BangumiCollectionItem[];
  watched?: BangumiCollectionItem[];
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

const TYPE_LABELS: Record<number, string> = {
  1: "书籍",
  2: "动画",
  3: "音乐",
  4: "游戏",
  6: "三次元",
};

function log(msg: string) {
  console.log(`[bangumi-process] ${msg}`);
}

function warn(msg: string) {
  console.warn(`[bangumi-process] ⚠ ${msg}`);
}

function truncate(s: string | undefined, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

async function findProvidedCover(subjectId: string, coverInputDir: string): Promise<string | undefined> {
  if (!coverInputDir || !existsSync(coverInputDir)) return undefined;

  const files = await readdir(coverInputDir);
  const matched = files.find((file) => {
    const lower = file.toLowerCase();
    return lower.startsWith(`${subjectId}.`) && /\.(jpg|jpeg|png|webp)$/.test(lower);
  });
  if (!matched) return undefined;

  await mkdir(COVERS_DIR, { recursive: true });
  const filename = basename(matched);
  await copyFile(resolve(coverInputDir, matched), resolve(COVERS_DIR, filename));
  log(`  使用外部封面: ${filename}`);
  return `/data/covers/${filename}`;
}

async function downloadCover(subjectId: string, url: string, coverInputDir = ""): Promise<string> {
  const ext = url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)?.[1] ?? "jpg";
  const filename = `${subjectId}.${ext}`;
  const filepath = resolve(COVERS_DIR, filename);
  const publicPath = `/data/covers/${filename}`;

  if (existsSync(filepath)) {
    log(`  封面已缓存: ${filename}`);
    return publicPath;
  }

  const providedCover = await findProvidedCover(subjectId, coverInputDir);
  if (providedCover) return providedCover;

  try {
    log(`  下载封面: ${url}`);
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "luqiu-bangumi-sync/0.1.0" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    await writeFile(filepath, buffer);
    log(`  封面已保存: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return publicPath;
  } catch (err) {
    warn(`  封面下载失败 ${subjectId}: ${err}`);
    return url;
  }
}

function mapItem(item: BangumiCollectionItem, status: AnimeItem["status"]): AnimeItem {
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

async function main() {
  const inputPath = process.argv.slice(2).find((arg) => arg !== "--");
  if (!inputPath) {
    console.error("缺少输入文件。用法：pnpm process-bangumi -- input.json");
    process.exit(1);
  }

  const coverInputDir = process.env.BANGUMI_COVER_DIR ? resolve(process.env.BANGUMI_COVER_DIR) : "";
  if (coverInputDir) log(`外部封面目录: ${coverInputDir}`);

  const raw = JSON.parse(await readFile(resolve(inputPath), "utf-8")) as RawBangumiData;
  const want = (raw.want ?? []).map((item) => mapItem(item, "want"));
  const watching = (raw.watching ?? []).map((item) => mapItem(item, "watching"));
  const watched = (raw.watched ?? []).map((item) => mapItem(item, "watched"));

  log(`读取原始数据: 想看 ${want.length}, 在追 ${watching.length}, 补完 ${watched.length}`);

  await mkdir(COVERS_DIR, { recursive: true });
  let coverCount = 0;
  for (const item of [...watching, ...watched, ...want]) {
    if (item.cover && (item.cover.startsWith("http://") || item.cover.startsWith("https://"))) {
      const localPath = await downloadCover(item.id, item.cover, coverInputDir);
      if (localPath.startsWith("/data/")) coverCount++;
      item.cover = localPath;
    }
  }

  const output: AnimeData = {
    watching,
    watched,
    want,
    lastUpdate: new Date().toISOString(),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  log(`封面处理完成: ${coverCount} 张已本地化`);
  log(`数据已写入: ${OUTPUT_FILE} (${watching.length + watched.length + want.length} 条)`);
}

main().catch((err) => {
  console.error(`[bangumi-process] ✗ ${String(err)}`);
  process.exit(1);
});
