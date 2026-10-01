<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import steamData from '../public/data/steam-data.json';
import animeData from '../public/data/anime-data.json';
import { sortGames, sortAnime, useMediaColumn } from './about-media';

const games = sortGames(steamData.games);
const anime = sortAnime(animeData.watched);
const columns = [
  { id: 'games', title: '玩过的游戏', subtitle: '按 Steam 累计游玩时长排序', ...useMediaColumn(ref(games.map(game => ({
    id: String(game.appid), title: game.name, cover: game.cover, fallbackCover: game.fallbackCover, url: game.url,
    detail: `${(game.playtimeMinutes / 60).toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 小时`,
  })))) },
  { id: 'anime', title: '看过的番剧', subtitle: '按 Bangumi 收藏更新时间排序', ...useMediaColumn(ref(anime.map(item => ({
    id: item.id, title: item.title, cover: item.cover, fallbackCover: '', url: `https://bgm.tv/subject/${item.id}`,
    detail: '已看',
  })))) },
];
const totals = { games: games.length, anime: anime.length };
const root = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | undefined;
const measureGrids = () => {
  root.value?.querySelectorAll<HTMLElement>('.media-grid').forEach(grid => {
    const card = grid.querySelector<HTMLElement>('.media-card');
    if (!card) return;
    const height = card.getBoundingClientRect().height;
    const gap = Number.parseFloat(getComputedStyle(grid).rowGap) || 0;
    grid.style.setProperty('--media-expanded-height', `${height * 3 + gap * 2}px`);
  });
};
onMounted(() => {
  resizeObserver = new ResizeObserver(measureGrids);
  root.value?.querySelectorAll('.media-grid').forEach(grid => resizeObserver?.observe(grid));
  measureGrids();
});
onBeforeUnmount(() => resizeObserver?.disconnect());
const toggleColumn = async (column: typeof columns[number]) => {
  column.toggle();
  await nextTick();
  const grid = root.value?.querySelector<HTMLElement>(`#${column.id}-cards`);
  if (grid) grid.scrollTop = 0;
  measureGrids();
};
const failedCovers = ref<Record<string, number>>({});
const coverKey = (column: string, id: string) => `${column}-${id}`;
const handleCoverError = (column: string, id: string) => {
  const key = coverKey(column, id);
  failedCovers.value[key] = (failedCovers.value[key] ?? 0) + 1;
};
</script>

<template>
  <div ref="root" class="about-media-cards">
    <section v-for="column in columns" :key="column.id" :data-media="column.id" :aria-labelledby="`${column.id}-heading`" class="media-column">
      <header class="media-heading">
        <h2 :id="`${column.id}-heading`"><svg class="media-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><template v-if="column.id === 'games'"><path d="M7 7h10c2 0 3 2 3.5 4l1 6c.4 2-1.5 3-3 1.5L16 16H8l-2.5 2.5C4 20 2.1 19 2.5 17l1-6C4 9 5 7 7 7Z"/><path d="M6 11h4M8 9v4"/><circle cx="16" cy="10" r=".6"/><circle cx="18" cy="12" r=".6"/></template><template v-else><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></template></svg>{{ column.title }}</h2>
      <button v-if="totals[column.id as keyof typeof totals] > 8" type="button" class="media-toggle"
        :aria-expanded="column.expanded.value" :aria-controls="`${column.id}-cards`" @click="toggleColumn(column)">
        {{ column.expanded.value ? '收起' : `显示全部 ${totals[column.id as keyof typeof totals]}` }}
        <span class="sr-only">{{ column.title }}</span>
      </button>
      </header>
      <ul :id="`${column.id}-cards`" class="media-grid" :class="{ 'is-expanded': column.expanded.value }" :tabindex="column.expanded.value ? 0 : undefined" :aria-label="column.title">
        <li v-for="item in column.visible.value" :key="item.id" class="media-card">
          <a :href="item.url" target="_blank" rel="noopener noreferrer" :title="`${item.title} · ${item.detail}`" :aria-label="`${item.title} · ${item.detail}`" @click.stop>
            <div class="media-cover">
              <img v-if="(failedCovers[coverKey(column.id, item.id)] ?? 0) < (item.fallbackCover ? 2 : 1)"
                :src="failedCovers[coverKey(column.id, item.id)] ? item.fallbackCover : item.cover"
                :alt="item.title" width="600" height="900" loading="lazy" decoding="async"
                @error="handleCoverError(column.id, item.id)" />
              <span v-else class="cover-placeholder" aria-hidden="true">{{ item.title }}</span>
              <span class="media-title-overlay"><span>{{ item.title }}</span></span>
            </div>
          </a>
        </li>
      </ul>
      <p v-if="!column.visible.value.length" class="media-empty">暂时没有记录。</p>

    </section>
  </div>
</template>

<style scoped lang="scss">
.about-media-cards { color: var(--lu-ink, var(--vp-c-text)); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--vp-c-divider, #ddd); }
.media-column { min-width: 0; }
.media-heading { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: 1rem; }
.media-heading h2 { display: flex; align-items: center; gap: 8px; margin: 0; padding: 0; border: 0; font-size: 20px; font-weight: 600; color: inherit; }
.media-icon { width: 20px; height: 20px; flex-shrink: 0; }

.media-heading p { margin: .65rem 0 1rem; font-size: .8rem; color: inherit;  }
.media-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem .65rem; margin: 0; padding: 0; list-style: none; }
.media-grid { align-content: start; overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-gutter: stable; overscroll-behavior-y: contain; }
.media-grid.is-expanded { max-height: var(--media-expanded-height); }
.media-grid::-webkit-scrollbar { width: 4px; }
.media-grid::-webkit-scrollbar-thumb { background: var(--vp-c-divider, #ccc); border-radius: 4px; }
.media-grid:focus-visible { outline: 2px solid var(--vp-c-accent, #3eaf7c); outline-offset: 3px; }
.media-card { min-width: 0; }
.media-card a { display: block; color: inherit; text-decoration: none; }
.media-card a::after { display: none !important; }
.media-cover { position: relative; overflow: hidden; aspect-ratio: 2 / 3; border-radius: .65rem; background: var(--vp-c-bg-alt, #eee); }
.media-cover img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { display: flex; height: 100%; align-items: center; justify-content: center; padding: .5rem; box-sizing: border-box; text-align: center; font-size: .75rem; }
.media-title-overlay { position: absolute; inset: auto 0 0; padding: 1.5rem .4rem .5rem; background: linear-gradient(transparent, rgba(0,0,0,.8)); color: #fff; font-size: 12px; line-height: 1.35; }
.media-title-overlay span { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.media-detail { display: block; margin-top: .2rem; font-size: .7rem; color: inherit;  }
.media-toggle { flex-shrink: 0; padding: .35rem .6rem; border: 1px solid var(--vp-c-divider, #ddd); border-radius: .65rem; background: transparent; color: inherit; font: inherit; font-size: 13px; cursor: pointer; }
.media-toggle:hover { background: var(--vp-c-bg-alt, #eee); }
.media-toggle:focus-visible, .media-card a:focus-visible { outline: 2px solid var(--vp-c-accent, #3eaf7c); outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 719px) { .about-media-cards { grid-template-columns: 1fr; gap: 2rem; } }
</style>
