import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ref } from 'vue';

const root = new URL('../', import.meta.url);
test('SSR component uses independent accessible 4-column grids and mobile stack', async () => {
  const source = await readFile(new URL('src/.vuepress/components/AboutMediaCards.vue', root), 'utf8');
  assert.match(source, /class="media-title-overlay"/);
  assert.ok(source.indexOf('class="media-toggle"') < source.indexOf('<ul'));
  assert.match(source, /看过的番剧/);
  assert.match(source, /import steamData from/);
  assert.match(source, /import animeData from/);
  assert.match(source, /:aria-expanded="column.expanded.value"/);
  assert.match(source, /repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(source, /@media.*max-width: 719px/s);
  assert.match(source, /grid-template-columns: 1fr/);
});
test('cards only navigate, expanded grids are bounded, and media precedes projects', async () => {
  const source = await readFile(new URL('src/.vuepress/components/AboutMediaCards.vue', root), 'utf8');
  const page = await readFile(new URL('src/intro.md', root), 'utf8');
  assert.match(source, /@click\.stop/);
  assert.match(source, /https:\/\/bgm\.tv\/subject\//);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /overflow-y: auto/);
  assert.match(source, /scrollbar-width: thin/);
  assert.match(source, /height \* 3/);
  assert.ok(page.indexOf('<AboutMediaCards />') < page.indexOf('## 做过的项目'));
});
test('media implementation exists', async () => {
  const media = await import('../src/.vuepress/components/about-media');
  const anime = JSON.parse(await readFile(new URL('src/.vuepress/public/data/anime-data.json', root), 'utf8'));
  const sorted = media.sortAnime(anime.watched);
  assert.equal(sorted.length, anime.watched.length);
  assert.deepEqual(sorted.map(x => x.id).sort(), anime.watched.map(x => x.id).sort());
  assert.ok(sorted.every((x, i) => !i || Date.parse(sorted[i - 1].updatedAt!) >= Date.parse(x.updatedAt!)));
  const games = media.sortGames([{ appid: 1, name: 'A', playtimeMinutes: 1 }, { appid: 2, name: 'B', playtimeMinutes: 0 }, { appid: 3, name: 'C', playtimeMinutes: 100 }]);
  assert.deepEqual(games.map(x => x.appid), [3, 1]);
  const left = media.useMediaColumn(ref(sorted));
  const right = media.useMediaColumn(ref(sorted));
  assert.equal(left.visible.value.length, 8);
  assert.equal(right.visible.value.length, 8);
  left.toggle();
  assert.equal(left.visible.value.length, sorted.length);
  assert.equal(right.visible.value.length, 8);
  right.toggle(); left.toggle();
  assert.equal(left.visible.value.length, 8);
  assert.equal(right.visible.value.length, sorted.length);
});

test('Steam sync retains raw minutes, portrait and never overwrites on invalid/empty/failure', async () => {
  const { syncSteamData } = await import('../scripts/fetch-steam-data');
  const dir = await mkdtemp(join(tmpdir(), 'steam-test-'));
  const output = join(dir, 'steam.json');
  const original = '{"previous":true}';
  try {
    for (const payload of [{ response: {} }, { response: { games: [] } }, { response: { games: [{ appid: 1, name: 'Zero', playtime_forever: 0 }] } }]) {
      await writeFile(output, original);
      await assert.rejects(syncSteamData({ key: 'test', steamId: '12345678901234567', output, backupDir: dir, request: async () => new Response(JSON.stringify(payload)) }));
      assert.equal(await readFile(output, 'utf8'), original);
    }
    await assert.rejects(syncSteamData({ key: 'test', steamId: '12345678901234567', output, backupDir: dir, request: async () => { throw new Error('private URL'); } }));
    assert.equal(await readFile(output, 'utf8'), original);
    await syncSteamData({ key: 'test', steamId: '12345678901234567', output, backupDir: dir, request: async () => new Response(JSON.stringify({ response: { games: [{ appid: 1, name: 'Small', playtime_forever: 7 }, { appid: 2, name: 'Large', playtime_forever: 121 }, { appid: 3, name: 'Zero', playtime_forever: 0 }] } })) });
    const result = JSON.parse(await readFile(output, 'utf8'));
    assert.deepEqual(result.games.map(x => x.playtimeMinutes), [121, 7]);
    assert.match(result.games[0].cover, /2\/library_600x900.jpg$/);
    assert.ok(result.games[0].fallbackCover);
    assert.ok(!(await readFile(output, 'utf8')).includes('test'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
