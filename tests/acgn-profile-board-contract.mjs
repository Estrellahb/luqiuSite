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
assert.match(component, /width:\s*1200px/);
assert.match(component, /height:\s*720px/);
assert.match(component, /DEFAULT_COLUMN_WIDTH\s*=\s*300/);
assert.match(component, /EXPANDED_COLUMN_WIDTH\s*=\s*912/);
assert.match(component, /COLLAPSED_COLUMN_WIDTH\s*=\s*96/);
assert.match(component, /overflow:\s*hidden/);
assert.match(intro, /<AcgnProfileBoard\s*\/>/);
assert.match(client, /app\.component\("AcgnProfileBoard", AcgnProfileBoard\)/);

console.log("ACGN profile board contract passed");
