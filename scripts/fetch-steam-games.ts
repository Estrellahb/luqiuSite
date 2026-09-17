import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type SteamOwnedGame = {
  appid: number;
  name: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  img_icon_url?: string;
};

type SteamOwnedGamesResponse = {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
};

type AcgnWork = {
  title: string;
  shortTitle: string;
  genre: string;
  score: number;
  weight: number;
  year: number;
  appId?: number;
  playtimeMinutes?: number;
  playtime2WeeksMinutes?: number;
  icon?: string;
  url?: string;
};

type AcgnCategory = {
  key: "A" | "C" | "G" | "N";
  name: string;
  label: string;
  unit: string;
  accent: string;
  background: string;
  total: number;
  genres: Array<{ name: string; value: number }>;
  works: AcgnWork[];
};

type AcgnProfileData = {
  version: number;
  updatedAt: string;
  sources: Record<string, {
    enabled: boolean;
    adapter: string;
    account?: string;
    description: string;
  }>;
  categories: AcgnCategory[];
};

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = resolve(projectRoot, ".env.local");
const outputFile = resolve(
  projectRoot,
  "src",
  ".vuepress",
  "public",
  "data",
  "acgn-profile.json",
);
const endpoint = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";

function parseEnv(content: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function loadCredentials() {
  let localEnv: Record<string, string> = {};
  try {
    localEnv = parseEnv(await readFile(envFile, "utf8"));
  } catch (reason) {
    const code = reason && typeof reason === "object" && "code" in reason
      ? String(reason.code)
      : "";
    if (code !== "ENOENT") throw reason;
  }

  const steamApiKey = process.env.STEAM_API_KEY || localEnv.STEAM_API_KEY || "";
  const steamId = process.env.STEAM_ID || localEnv.STEAM_ID || "";
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    localEnv.HTTPS_PROXY ||
    localEnv.https_proxy ||
    "";

  if (!steamApiKey) throw new Error("缺少 STEAM_API_KEY，请写入 .env.local 或环境变量");
  if (!/^\d{17}$/.test(steamId)) {
    throw new Error("缺少有效的 17 位 STEAM_ID，请写入 .env.local 或环境变量");
  }

  return { steamApiKey, steamId, proxy };
}

function curlConfigValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function fetchOwnedGames(
  steamApiKey: string,
  steamId: string,
  proxy: string,
): Promise<SteamOwnedGamesResponse> {
  const args = [
    "--silent",
    "--show-error",
    "--fail-with-body",
    "--connect-timeout",
    "10",
    "--max-time",
    "60",
    "--get",
    endpoint,
    "--config",
    "-",
  ];
  if (proxy) args.unshift("--proxy", proxy);

  const config = [
    `data-urlencode = "key=${curlConfigValue(steamApiKey)}"`,
    `data-urlencode = "steamid=${curlConfigValue(steamId)}"`,
    'data-urlencode = "include_appinfo=true"',
    'data-urlencode = "include_played_free_games=true"',
    'data-urlencode = "format=json"',
    "",
  ].join("\n");

  return new Promise((resolvePromise, reject) => {
    const child = spawn("curl", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Steam API 请求失败（curl ${code}）：${stderr.trim()}`));
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout) as SteamOwnedGamesResponse);
      } catch {
        reject(new Error("Steam API 返回了无法解析的 JSON"));
      }
    });

    child.stdin.end(config);
  });
}

function toWork(game: SteamOwnedGame): AcgnWork {
  const playtimeMinutes = game.playtime_forever ?? 0;
  return {
    title: game.name,
    shortTitle: game.name,
    genre: "Steam",
    score: 0,
    weight: 1,
    year: 0,
    appId: game.appid,
    playtimeMinutes,
    playtime2WeeksMinutes: game.playtime_2weeks ?? 0,
    icon: game.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
      : "",
    url: `https://store.steampowered.com/app/${game.appid}/`,
  };
}

async function main() {
  const { steamApiKey, steamId, proxy } = await loadCredentials();
  console.log(`[steam-sync] 正在读取 Steam 游戏库${proxy ? "（使用代理）" : ""}…`);

  const payload = await fetchOwnedGames(steamApiKey, steamId, proxy);
  const ownedGames = payload.response?.games;
  if (!ownedGames) {
    throw new Error("Steam API 未返回游戏列表，请检查账号游戏详情是否公开");
  }

  const works = ownedGames
    .filter((game) => (game.playtime_forever ?? 0) > 0)
    .map(toWork)
    .sort((left, right) =>
      (right.playtimeMinutes ?? 0) - (left.playtimeMinutes ?? 0) ||
      left.title.localeCompare(right.title),
    );

  const profile = JSON.parse(await readFile(outputFile, "utf8")) as AcgnProfileData;
  const gameCategory = profile.categories.find((category) => category.key === "G");
  if (!gameCategory) throw new Error("ACGN 数据中缺少 G 游戏分类");

  gameCategory.total = works.length;
  gameCategory.genres = [{ name: "Steam", value: 100 }];
  gameCategory.works = works;
  profile.updatedAt = new Date().toISOString().slice(0, 10);
  profile.sources.steam = {
    enabled: true,
    adapter: "steam-web-api",
    account: steamId,
    description: "通过 Steam Web API 同步有游玩时长的游戏",
  };

  await writeFile(outputFile, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  const excluded = ownedGames.length - works.length;
  console.log(
    `[steam-sync] 已写入 ${works.length} 款游戏，过滤 ${excluded} 款零时长游戏：${outputFile}`,
  );
}

main().catch((reason) => {
  console.error(`[steam-sync] ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exitCode = 1;
});
