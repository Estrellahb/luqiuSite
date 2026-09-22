import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dataUrl = new URL("src/.vuepress/public/data/acgn-profile.json", root);
const componentUrl = new URL("src/.vuepress/components/AcgnProfileBoard.vue", root);
const introUrl = new URL("src/intro.md", root);
const clientUrl = new URL("src/.vuepress/client.ts", root);
const packageUrl = new URL("package.json", root);
const steamSyncUrl = new URL("scripts/fetch-steam-games.ts", root);

const data = JSON.parse(await readFile(dataUrl, "utf8"));
const component = await readFile(componentUrl, "utf8");
const intro = await readFile(introUrl, "utf8");
const client = await readFile(clientUrl, "utf8");
const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));
const steamSync = await readFile(steamSyncUrl, "utf8");

assert.deepEqual(
  data.categories.map((category) => category.key),
  ["A", "C", "G", "N"],
  "ACGN categories must keep the fixed display order",
);
assert.equal(data.sources.bangumi.enabled, false);
assert.equal(data.sources.steam.enabled, true);
assert.equal(data.sources.steam.adapter, "steam-web-api");
assert.equal(data.sources.manual.enabled, true);

const gameCategory = data.categories.find((category) => category.key === "G");
assert.ok(gameCategory, "game category must exist");
assert.equal(gameCategory.total, gameCategory.works.length);
assert.ok(gameCategory.works.length > 0, "Steam sync must produce played games");
assert.ok(
  gameCategory.works.every((game) => game.playtimeMinutes > 0),
  "zero-playtime games must be excluded",
);
assert.deepEqual(
  gameCategory.works.map((game) => game.playtimeMinutes),
  [...gameCategory.works]
    .sort((left, right) =>
      right.playtimeMinutes - left.playtimeMinutes || left.title.localeCompare(right.title),
    )
    .map((game) => game.playtimeMinutes),
  "games must be sorted by total playtime descending",
);

assert.equal(packageJson.scripts["fetch-steam"], "tsx scripts/fetch-steam-games.ts");
assert.match(steamSync, /GetOwnedGames\/v1/);
assert.match(steamSync, /include_appinfo/);
assert.match(steamSync, /playtime_forever/);
assert.match(component, /acgn-steam-list/);
assert.match(component, /formatPlaytime/);
assert.match(component, /playtimeMinutes/);
assert.match(
  component,
  /<div class="acgn-steam-heading">\s*<strong>Steam 游戏时长<\/strong>\s*<\/div>/,
);
assert.doesNotMatch(component, /<span>总时长<\/span>/);
assert.doesNotMatch(component, /仅显示有游玩记录的游戏，按总时长从高到低排列/);
assert.doesNotMatch(component, /\{\{ category\.total \}\} 款/);
assert.doesNotMatch(component, /totalPlaytime/);
assert.doesNotMatch(component, /acgn-steam-recent/);
assert.doesNotMatch(component, /近两周/);
assert.doesNotMatch(component, /formatPlaytime\(work\.playtime2WeeksMinutes\)/);
assert.match(component, /\.acgn-steam-item::after\s*\{\s*display:\s*none\s*!important;\s*\}/);
assert.match(component, /width:\s*1200px/);
assert.match(component, /height:\s*720px/);
assert.match(component, /DEFAULT_COLUMN_WIDTH\s*=\s*300/);
assert.match(component, /EXPANDED_COLUMN_WIDTH\s*=\s*912/);
assert.match(component, /COLLAPSED_COLUMN_WIDTH\s*=\s*96/);
assert.match(component, /overflow:\s*hidden/);
assert.match(component, /new IntersectionObserver/);
assert.match(component, /observer\.unobserve\(entry\.target\)/);
assert.match(component, /'has-entered-viewport': hasEnteredViewport/);
assert.match(component, /@keyframes acgn-donut-enter/);
assert.match(component, /transform:\s*rotate\(0deg\)/);
assert.match(component, /transform:\s*rotate\(360deg\)/);
assert.match(component, /class="acgn-donut-ring"/);
assert.match(component, /\.acgn-profile-section\.has-entered-viewport \.acgn-donut-ring/);
assert.match(component, /animation:\s*acgn-donut-enter 1300ms/);
assert.doesNotMatch(component, /\.acgn-profile-section\.has-entered-viewport \.acgn-donut\s*\{/);
assert.match(component, /\.acgn-donut-center\s*\{[^}]*z-index:\s*1/s);
assert.match(intro, /<AcgnProfileBoard\s*\/>/);
assert.match(client, /app\.component\("AcgnProfileBoard", AcgnProfileBoard\)/);

console.log("ACGN profile board contract passed");
