/** Refresh the public Steam snapshot; credentials never enter generated data. */
import { readFile, mkdir, copyFile, writeFile, rename, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { sortGames } from '../src/.vuepress/components/about-media';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
interface Options {
  key: string;
  steamId: string;
  output: string;
  backupDir: string;
  request?: typeof fetch;
}
export async function syncSteamData({ key, steamId, output, backupDir, request = fetch }: Options) {
  if (!key || !/^\d{17}$/.test(steamId)) throw new Error('Missing or invalid Steam credentials.');
  const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  url.search = new URLSearchParams({ key, steamid: steamId, include_appinfo: 'true', include_played_free_games: 'true' }).toString();
  let payload: any;
  try {
    const response = await request(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('HTTP failure');
    payload = await response.json();
  } catch { throw new Error('Steam request failed; existing snapshot was preserved.'); }
  const raw = payload?.response?.games;
  if (!Array.isArray(raw) || !raw.length) throw new Error('Steam returned no games; check game-details privacy. Snapshot preserved.');
  if (!raw.every(game => Number.isInteger(game.appid) && game.appid > 0 && typeof game.name === 'string' && game.name.trim() && Number.isInteger(game.playtime_forever) && game.playtime_forever >= 0)) {
    throw new Error('Steam returned invalid game data; snapshot preserved.');
  }
  const games = sortGames(raw.map(game => ({
    appid: game.appid,
    name: game.name,
    playtimeMinutes: game.playtime_forever,
    cover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`,
    fallbackCover: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
    url: `https://store.steampowered.com/app/${game.appid}/`,
  })));
  if (!games.length) throw new Error('Steam returned no played games; snapshot preserved.');
  const data = { games, lastUpdate: new Date().toISOString(), source: 'Steam GetOwnedGames' };
  await mkdir(dirname(output), { recursive: true });
  await mkdir(backupDir, { recursive: true });
  try { await copyFile(output, resolve(backupDir, `steam-data-${Date.now()}.json`)); }
  catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  const temporary = `${output}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o644 });
    await rename(temporary, output);
  } finally { await rm(temporary, { force: true }); }
  return data;
}

async function main() {
  // Node's dotenv parser supports quotes/comments without executing shell code.
  const { parseEnv } = await import('node:util');
  let local: Record<string, string> = {};
  try { local = parseEnv(await readFile(resolve(ROOT, '.env.local'), 'utf8')); }
  catch (error: any) { if (error.code !== 'ENOENT') throw new Error('Could not load local Steam configuration.'); }
  const data = await syncSteamData({
    key: process.env.STEAM_API_KEY ?? local.STEAM_API_KEY ?? '',
    steamId: process.env.STEAM_ID ?? local.STEAM_ID ?? '',
    output: resolve(ROOT, 'src/.vuepress/public/data/steam-data.json'),
    backupDir: resolve(ROOT, 'backup'),
  });
  console.log(`Steam snapshot refreshed: ${data.games.length} played games (raw cumulative minutes).`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    console.error('Steam refresh failed. Existing snapshot preserved; check credentials, privacy and network.');
    process.exitCode = 1;
  });
}
