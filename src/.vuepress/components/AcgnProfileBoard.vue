<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type SourceConfig = {
  enabled: boolean;
  adapter: string;
  account?: string;
  description: string;
};

type Genre = {
  name: string;
  value: number;
};

type Work = {
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

type Category = {
  key: "A" | "C" | "G" | "N";
  name: string;
  label: string;
  unit: string;
  accent: string;
  background: string;
  total: number;
  genres: Genre[];
  works: Work[];
};

type AcgnProfileData = {
  version: number;
  updatedAt: string;
  sources: Record<"bangumi" | "steam" | "manual", SourceConfig>;
  categories: Category[];
};

const DEFAULT_COLUMN_WIDTH = 300;
const EXPANDED_COLUMN_WIDTH = 912;
const COLLAPSED_COLUMN_WIDTH = 96;
const MAX_VISIBLE_WORKS = 12;

const data = ref<AcgnProfileData | null>(null);
const loading = ref(true);
const error = ref("");
const expandedKey = ref<Category["key"] | null>(null);
const activeGenres = ref<Record<string, string | null>>({});
const activeViews = ref<Record<string, "works" | "heat">>({});
const selectedWork = ref<Work | null>(null);

const categories = computed(() => data.value?.categories ?? []);

const columnWidth = (key: Category["key"]) => {
  if (!expandedKey.value) return DEFAULT_COLUMN_WIDTH;
  return expandedKey.value === key
    ? EXPANDED_COLUMN_WIDTH
    : COLLAPSED_COLUMN_WIDTH;
};

const toggleCategory = (key: Category["key"]) => {
  expandedKey.value = expandedKey.value === key ? null : key;
  selectedWork.value = null;
};

const setGenre = (categoryKey: string, genre: string | null) => {
  activeGenres.value[categoryKey] =
    activeGenres.value[categoryKey] === genre ? null : genre;
  selectedWork.value = null;
};

const setView = (categoryKey: string, view: "works" | "heat") => {
  activeViews.value[categoryKey] = view;
  selectedWork.value = null;
};

const currentView = (categoryKey: string) =>
  activeViews.value[categoryKey] ?? "works";

const visibleWorks = (category: Category) => {
  const genre = activeGenres.value[category.key];
  const filtered = genre
    ? category.works.filter((work) => work.genre === genre)
    : category.works;

  return [...filtered]
    .sort((left, right) => right.weight - left.weight || right.score - left.score)
    .slice(0, MAX_VISIBLE_WORKS);
};

const steamWorks = (category: Category) =>
  [...category.works].sort((left, right) =>
    (right.playtimeMinutes ?? 0) - (left.playtimeMinutes ?? 0) ||
    left.title.localeCompare(right.title),
  );

const formatPlaytime = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} 分钟`;
  if (remainingMinutes === 0) return `${hours} 小时`;
  return `${hours} 小时 ${remainingMinutes} 分钟`;
};

const genreGradient = (category: Category) => {
  const total = category.genres.reduce((sum, genre) => sum + genre.value, 0) || 1;
  let cursor = 0;
  const segments = category.genres.map((genre, index) => {
    const start = cursor;
    cursor += (genre.value / total) * 100;
    const alpha = Math.max(0.35, 0.92 - index * 0.12);
    return `color-mix(in srgb, ${category.accent} ${Math.round(alpha * 100)}%, white) ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
};

const scoreTone = (category: Category, score: number) => {
  const strength = Math.round(34 + Math.max(0, Math.min(10, score)) * 5.2);
  return `color-mix(in srgb, ${category.accent} ${strength}%, white)`;
};

const bubbleSize = (weight: number) => {
  if (weight >= 3) return 128;
  if (weight === 2) return 104;
  return 78;
};

const heatCells = (category: Category) => {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  return category.genres.slice(0, 5).flatMap((genre, row) =>
    years.map((year, column) => ({
      genre: genre.name,
      year,
      value: 24 + ((row * 19 + column * 13 + category.total) % 68),
    })),
  );
};

const handleKeydown = (event: KeyboardEvent, key: Category["key"]) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleCategory(key);
  }

  if (event.key === "Escape") {
    expandedKey.value = null;
    selectedWork.value = null;
  }
};

onMounted(async () => {
  try {
    const response = await fetch("/data/acgn-profile.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data.value = (await response.json()) as AcgnProfileData;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "未知错误";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="acgn-profile-section" aria-labelledby="acgn-profile-title">
    <div class="acgn-profile-heading">
      <div>
        <p class="acgn-profile-kicker">PERSONAL INTEREST PROFILE</p>
        <h2 id="acgn-profile-title">ACGN 兴趣展示</h2>
      </div>
      <p class="acgn-profile-caption">
        游戏数据由 Steam Web API 同步；动画、漫画与小说当前为手动示例数据。
      </p>
    </div>

    <div v-if="loading" class="acgn-board-state" aria-live="polite">
      正在读取兴趣数据…
    </div>

    <div v-else-if="error" class="acgn-board-state acgn-board-state-error" role="alert">
      数据读取失败：{{ error }}
    </div>

    <div v-else class="acgn-board-frame">
      <div class="acgn-board" :class="{ 'is-expanded': expandedKey }">
        <article
          v-for="category in categories"
          :key="category.key"
          class="acgn-column"
          :class="{
            'is-active': expandedKey === category.key,
            'is-collapsed': expandedKey && expandedKey !== category.key,
          }"
          :style="{
            width: `${columnWidth(category.key)}px`,
            background: category.background,
            '--acgn-accent': category.accent,
          }"
          role="button"
          tabindex="0"
          :aria-expanded="expandedKey === category.key"
          :aria-label="`${category.label}，共 ${category.total} ${category.unit}`"
          @click="toggleCategory(category.key)"
          @keydown="handleKeydown($event, category.key)"
        >
          <div class="acgn-column-mark" aria-hidden="true">{{ category.key }}</div>

          <div v-if="!expandedKey" class="acgn-overview">
            <div class="acgn-overview-title">
              <strong>{{ category.name }}</strong>
              <span>{{ category.label }}</span>
            </div>

            <div
              class="acgn-donut acgn-donut-small"
              :style="{ background: genreGradient(category) }"
              aria-hidden="true"
            >
              <div class="acgn-donut-center">
                <strong>{{ category.total }}</strong>
                <span>{{ category.unit }}</span>
              </div>
            </div>

            <div class="acgn-mini-genres">
              <span v-for="genre in category.genres.slice(0, 3)" :key="genre.name">
                {{ genre.name }} {{ genre.value }}%
              </span>
            </div>
            <span class="acgn-open-hint">点击展开</span>
          </div>

          <div v-else-if="expandedKey === category.key" class="acgn-expanded">
            <header class="acgn-expanded-header">
              <div class="acgn-expanded-identity">
                <strong>{{ category.name }}</strong>
                <span>{{ category.label }}</span>
              </div>
              <div class="acgn-expanded-actions" @click.stop>
                <div class="acgn-view-switch" aria-label="视图切换">
                  <button
                    type="button"
                    :class="{ active: currentView(category.key) === 'works' }"
                    @click="setView(category.key, 'works')"
                  >
                    作品图谱
                  </button>
                  <button
                    type="button"
                    :class="{ active: currentView(category.key) === 'heat' }"
                    @click="setView(category.key, 'heat')"
                  >
                    时间热度
                  </button>
                </div>
                <div class="acgn-total">
                  <strong>{{ category.total }}</strong>
                  <span>{{ category.unit }}</span>
                </div>
              </div>
            </header>

            <div
              v-if="category.key === 'G' && currentView(category.key) === 'works'"
              class="acgn-steam-panel"
              @click.stop
            >
              <div class="acgn-steam-heading">
                <div>
                  <strong>Steam 游戏时长</strong>
                  <span>仅显示有游玩记录的游戏，按总时长从高到低排列</span>
                </div>
                <span>{{ category.total }} 款</span>
              </div>

              <div class="acgn-steam-list" aria-label="Steam 游戏时长列表">
                <a
                  v-for="(work, index) in steamWorks(category)"
                  :key="work.appId ?? work.title"
                  class="acgn-steam-item"
                  :href="work.url"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span class="acgn-steam-rank">{{ String(index + 1).padStart(2, '0') }}</span>
                  <img v-if="work.icon" :src="work.icon" alt="" loading="lazy" />
                  <span v-else class="acgn-steam-icon-placeholder" aria-hidden="true"></span>
                  <strong>{{ work.title }}</strong>
                  <span class="acgn-steam-recent" v-if="work.playtime2WeeksMinutes">
                    近两周 {{ formatPlaytime(work.playtime2WeeksMinutes) }}
                  </span>
                  <b>{{ formatPlaytime(work.playtimeMinutes) }}</b>
                </a>
              </div>
            </div>

            <div v-else-if="currentView(category.key) === 'works'" class="acgn-expanded-body">
              <aside class="acgn-chart-panel" @click.stop>
                <div
                  class="acgn-donut acgn-donut-large"
                  :style="{ background: genreGradient(category) }"
                  aria-hidden="true"
                >
                  <div class="acgn-donut-center">
                    <strong>{{ category.total }}</strong>
                    <span>{{ category.unit }}</span>
                  </div>
                </div>

                <div class="acgn-genre-list" aria-label="类型筛选">
                  <button
                    type="button"
                    :class="{ active: !activeGenres[category.key] }"
                    @click="setGenre(category.key, null)"
                  >
                    <span>全部</span>
                    <strong>{{ category.total }}</strong>
                  </button>
                  <button
                    v-for="genre in category.genres"
                    :key="genre.name"
                    type="button"
                    :class="{ active: activeGenres[category.key] === genre.name }"
                    @click="setGenre(category.key, genre.name)"
                  >
                    <span>{{ genre.name }}</span>
                    <strong>{{ genre.value }}%</strong>
                  </button>
                </div>
              </aside>

              <div class="acgn-work-panel" @click.stop>
                <div class="acgn-work-panel-heading">
                  <div>
                    <strong>作品图谱</strong>
                    <span>按投入程度与评分显示</span>
                  </div>
                  <span>首屏 {{ visibleWorks(category).length }} / {{ category.total }}</span>
                </div>

                <div class="acgn-bubble-field">
                  <button
                    v-for="work in visibleWorks(category)"
                    :key="work.title"
                    type="button"
                    class="acgn-work-bubble"
                    :class="{ selected: selectedWork?.title === work.title }"
                    :style="{
                      width: `${bubbleSize(work.weight)}px`,
                      height: `${bubbleSize(work.weight)}px`,
                      background: scoreTone(category, work.score),
                    }"
                    :title="`${work.title} · ${work.year} · ${work.genre} · ${work.score} 分`"
                    @click="selectedWork = work"
                  >
                    <span>{{ work.shortTitle }}</span>
                    <small>{{ work.score }}</small>
                  </button>
                </div>

                <div v-if="selectedWork" class="acgn-work-detail" aria-live="polite">
                  <div>
                    <strong>{{ selectedWork.title }}</strong>
                    <span>{{ selectedWork.year }} · {{ selectedWork.genre }}</span>
                  </div>
                  <b>{{ selectedWork.score }}</b>
                </div>
                <p v-else class="acgn-work-note">
                  当前只展示权重最高的作品，其余内容后续通过搜索、筛选与分页查看。
                </p>
              </div>
            </div>

            <div v-else class="acgn-heat-panel" @click.stop>
              <div class="acgn-heat-heading">
                <div>
                  <strong>时间热度</strong>
                  <span>示例数据 · 按年份与类型展示兴趣变化</span>
                </div>
                <span>2021—2026</span>
              </div>
              <div class="acgn-heat-grid">
                <span class="acgn-heat-corner"></span>
                <span v-for="year in [2021, 2022, 2023, 2024, 2025, 2026]" :key="year" class="acgn-heat-year">
                  {{ year }}
                </span>
                <template v-for="genre in category.genres.slice(0, 5)" :key="genre.name">
                  <span class="acgn-heat-label">{{ genre.name }}</span>
                  <span
                    v-for="cell in heatCells(category).filter((item) => item.genre === genre.name)"
                    :key="`${cell.genre}-${cell.year}`"
                    class="acgn-heat-cell"
                    :style="{
                      background: `color-mix(in srgb, ${category.accent} ${cell.value}%, white)`,
                    }"
                    :title="`${cell.year} · ${cell.genre} · 热度 ${cell.value}`"
                  ></span>
                </template>
              </div>
              <p>时间热度视图已预留；接入真实记录日期后替换示例强度。</p>
            </div>
          </div>

          <div v-else class="acgn-collapsed-content">
            <span>{{ category.label }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.acgn-profile-section {
  width: 1200px;
  max-width: 1200px;
  margin: 56px auto 64px;
  color: #1f2533;
  font-family: "Avenir Next", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.acgn-profile-heading {
  display: flex;
  height: 72px;
  margin-bottom: 16px;
  align-items: flex-end;
  justify-content: space-between;
}

.acgn-profile-heading h2 {
  margin: 4px 0 0;
  color: #1f2533;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 36px;
}

.acgn-profile-kicker {
  margin: 0;
  color: #7b8394;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 16px;
}

.acgn-profile-caption {
  width: 390px;
  margin: 0 0 4px;
  color: #737b8b;
  font-size: 13px;
  line-height: 22px;
  text-align: right;
}

.acgn-board-frame,
.acgn-board-state {
  width: 1200px;
  height: 720px;
  border: 1px solid rgba(54, 62, 82, 0.14);
  border-radius: 24px;
  overflow: hidden;
  background: #f8f9fc;
  box-shadow: 0 24px 64px rgba(49, 58, 82, 0.13);
  box-sizing: border-box;
}

.acgn-board-state {
  display: grid;
  place-items: center;
  color: #737b8b;
  font-size: 14px;
}

.acgn-board-state-error {
  color: #9d4541;
}

.acgn-board {
  display: flex;
  width: 1200px;
  height: 720px;
  overflow: hidden;
}

.acgn-column {
  --acgn-accent: #6f86ff;
  position: relative;
  flex: 0 0 auto;
  height: 720px;
  padding: 24px 20px;
  border: 0;
  border-right: 1px solid rgba(54, 62, 82, 0.12);
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
  outline: none;
  transition: width 400ms ease, filter 240ms ease;
}

.acgn-column:last-child {
  border-right: 0;
}

.acgn-column:hover,
.acgn-column:focus-visible {
  filter: saturate(1.05) brightness(0.99);
}

.acgn-column:focus-visible::after {
  position: absolute;
  inset: 6px;
  border: 2px solid var(--acgn-accent);
  border-radius: 16px;
  content: "";
  pointer-events: none;
}

.acgn-column.is-active {
  padding: 24px 32px;
  cursor: default;
}

.acgn-column.is-collapsed {
  padding: 24px 12px;
}

.acgn-column-mark {
  position: absolute;
  top: 18px;
  left: 20px;
  color: var(--acgn-accent);
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 64px;
  font-weight: 650;
  letter-spacing: -0.08em;
  line-height: 72px;
  transition: left 400ms ease, font-size 280ms ease, transform 400ms ease;
}

.acgn-column.is-active .acgn-column-mark {
  left: 32px;
  font-size: 54px;
  line-height: 60px;
}

.acgn-column.is-collapsed .acgn-column-mark {
  top: 50%;
  left: 50%;
  font-size: 48px;
  line-height: 56px;
  transform: translate(-54%, -50%);
}

.acgn-overview {
  display: flex;
  height: 100%;
  padding-top: 86px;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
}

.acgn-overview-title {
  width: 100%;
}

.acgn-overview-title strong,
.acgn-expanded-identity strong {
  display: block;
  color: #273044;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.15em;
  line-height: 22px;
}

.acgn-overview-title span,
.acgn-expanded-identity span {
  display: block;
  margin-top: 2px;
  color: #697286;
  font-size: 13px;
  line-height: 20px;
}

.acgn-donut {
  position: relative;
  border-radius: 50%;
}

.acgn-donut::after {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  content: "";
}

.acgn-donut-small {
  width: 176px;
  height: 176px;
  margin-top: 68px;
}

.acgn-donut-small::after {
  inset: 31px;
}

.acgn-donut-large {
  width: 174px;
  height: 174px;
  margin: 8px auto 24px;
}

.acgn-donut-large::after {
  inset: 30px;
}

.acgn-donut-center {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.acgn-donut-center strong {
  color: #273044;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 30px;
  font-weight: 650;
  line-height: 34px;
}

.acgn-donut-center span {
  color: #747d8f;
  font-size: 12px;
  line-height: 18px;
}

.acgn-mini-genres {
  display: flex;
  width: 100%;
  margin-top: 48px;
  gap: 8px;
  flex-direction: column;
}

.acgn-mini-genres span {
  display: flex;
  height: 28px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--acgn-accent) 28%, transparent);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  color: #576075;
  font-size: 12px;
  line-height: 28px;
  box-sizing: border-box;
}

.acgn-open-hint {
  margin-top: auto;
  color: #727b8d;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  line-height: 20px;
}

.acgn-expanded {
  height: 100%;
  padding-top: 68px;
  box-sizing: border-box;
  cursor: default;
}

.acgn-expanded-header {
  display: flex;
  height: 64px;
  border-bottom: 1px solid rgba(54, 62, 82, 0.13);
  align-items: flex-start;
  justify-content: space-between;
}

.acgn-expanded-actions {
  display: flex;
  gap: 24px;
  align-items: center;
}

.acgn-view-switch {
  display: flex;
  height: 34px;
  padding: 3px;
  border: 1px solid rgba(54, 62, 82, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  box-sizing: border-box;
}

.acgn-view-switch button {
  height: 26px;
  padding: 0 13px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #70798c;
  font-size: 12px;
  cursor: pointer;
}

.acgn-view-switch button.active {
  background: #fff;
  color: #273044;
  box-shadow: 0 3px 10px rgba(54, 62, 82, 0.12);
}

.acgn-total {
  display: flex;
  min-width: 70px;
  align-items: baseline;
  justify-content: flex-end;
}

.acgn-total strong {
  color: #273044;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 26px;
  font-weight: 650;
  line-height: 32px;
}

.acgn-total span {
  margin-left: 4px;
  color: #717a8d;
  font-size: 12px;
}

.acgn-expanded-body {
  display: grid;
  height: 540px;
  padding-top: 20px;
  grid-template-columns: 204px 1fr;
  gap: 24px;
  box-sizing: border-box;
}

.acgn-steam-panel {
  height: 540px;
  padding-top: 20px;
  box-sizing: border-box;
}

.acgn-steam-heading {
  display: flex;
  height: 42px;
  align-items: flex-start;
  justify-content: space-between;
}

.acgn-steam-heading div {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.acgn-steam-heading strong {
  color: #273044;
  font-size: 15px;
  line-height: 22px;
}

.acgn-steam-heading span {
  color: #747d8f;
  font-size: 11px;
  line-height: 20px;
}

.acgn-steam-list {
  height: 478px;
  padding-right: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: color-mix(in srgb, var(--acgn-accent) 34%, transparent) transparent;
  scrollbar-width: thin;
}

.acgn-steam-item {
  display: grid;
  height: 56px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(54, 62, 82, 0.09);
  color: #273044;
  text-decoration: none;
  grid-template-columns: 34px 32px minmax(0, 1fr) 160px 128px;
  gap: 12px;
  align-items: center;
  box-sizing: border-box;
  transition: background 160ms ease;
}

.acgn-steam-item:hover,
.acgn-steam-item:focus-visible {
  background: rgba(255, 255, 255, 0.58);
  outline: none;
}

.acgn-steam-rank {
  color: #8a92a2;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 11px;
}

.acgn-steam-item img,
.acgn-steam-icon-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--acgn-accent) 16%, white);
  object-fit: cover;
}

.acgn-steam-item strong {
  overflow: hidden;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acgn-steam-recent {
  overflow: hidden;
  color: #747d8f;
  font-size: 11px;
  line-height: 18px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acgn-steam-item b {
  color: var(--acgn-accent);
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-align: right;
}

.acgn-chart-panel {
  height: 520px;
  padding-right: 20px;
  border-right: 1px solid rgba(54, 62, 82, 0.12);
  box-sizing: border-box;
}

.acgn-genre-list {
  display: flex;
  gap: 6px;
  flex-direction: column;
}

.acgn-genre-list button {
  display: flex;
  width: 100%;
  height: 34px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #657084;
  font-size: 12px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.acgn-genre-list button:hover,
.acgn-genre-list button.active {
  border-color: color-mix(in srgb, var(--acgn-accent) 28%, transparent);
  background: rgba(255, 255, 255, 0.58);
  color: #273044;
}

.acgn-work-panel {
  position: relative;
  height: 520px;
  overflow: hidden;
}

.acgn-work-panel-heading,
.acgn-heat-heading {
  display: flex;
  height: 42px;
  align-items: flex-start;
  justify-content: space-between;
}

.acgn-work-panel-heading div,
.acgn-heat-heading div {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.acgn-work-panel-heading strong,
.acgn-heat-heading strong {
  color: #273044;
  font-size: 15px;
  line-height: 22px;
}

.acgn-work-panel-heading span,
.acgn-heat-heading span {
  color: #747d8f;
  font-size: 11px;
  line-height: 20px;
}

.acgn-bubble-field {
  display: flex;
  height: 424px;
  padding: 6px 2px;
  gap: 5px;
  overflow: hidden;
  align-content: flex-start;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.acgn-work-bubble {
  display: flex;
  flex: 0 0 auto;
  padding: 9px;
  border: 2px solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  color: #273044;
  box-shadow: 0 7px 18px rgba(54, 62, 82, 0.1);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-sizing: border-box;
  transition: transform 180ms ease, border-color 180ms ease;
}

.acgn-work-bubble:hover,
.acgn-work-bubble:focus-visible,
.acgn-work-bubble.selected {
  border-color: var(--acgn-accent);
  outline: none;
  transform: translateY(-3px);
}

.acgn-work-bubble span {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  font-weight: 650;
  line-height: 16px;
  text-align: center;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.acgn-work-bubble small {
  margin-top: 3px;
  color: rgba(39, 48, 68, 0.66);
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 10px;
  line-height: 13px;
}

.acgn-work-detail,
.acgn-work-note {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 44px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid rgba(54, 62, 82, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.62);
  color: #717a8d;
  font-size: 11px;
  line-height: 44px;
  box-sizing: border-box;
}

.acgn-work-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.acgn-work-detail div {
  display: flex;
  flex-direction: column;
}

.acgn-work-detail strong {
  color: #273044;
  font-size: 13px;
  line-height: 18px;
}

.acgn-work-detail span {
  color: #747d8f;
  font-size: 10px;
  line-height: 15px;
}

.acgn-work-detail b {
  color: var(--acgn-accent);
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 20px;
}

.acgn-heat-panel {
  height: 540px;
  padding-top: 20px;
  box-sizing: border-box;
}

.acgn-heat-grid {
  display: grid;
  width: 100%;
  height: 390px;
  margin-top: 28px;
  grid-template-columns: 90px repeat(6, 1fr);
  grid-template-rows: 30px repeat(5, 62px);
  gap: 8px;
}

.acgn-heat-year,
.acgn-heat-label {
  display: flex;
  color: #727b8d;
  font-family: "IBM Plex Mono", "Roboto Mono", "Noto Sans Mono", monospace;
  font-size: 11px;
  align-items: center;
}

.acgn-heat-year {
  justify-content: center;
}

.acgn-heat-cell {
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  box-shadow: 0 5px 14px rgba(54, 62, 82, 0.07);
}

.acgn-heat-panel > p {
  margin: 22px 0 0;
  color: #747d8f;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
}

.acgn-collapsed-content {
  position: absolute;
  right: 0;
  bottom: 36px;
  left: 0;
  color: #6f788a;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .acgn-column,
  .acgn-work-bubble {
    transition: none;
  }
}

@media (max-width: 1260px) {
  .acgn-profile-section {
    width: 1200px;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
