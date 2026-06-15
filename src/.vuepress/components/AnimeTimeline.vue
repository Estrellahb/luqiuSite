<script setup lang="ts">
import { computed, ref, onMounted } from "vue";

// ─── 类型 ─────────────────────────────────────────────────

interface AnimeItem {
  id: string;
  title: string;
  originalTitle?: string;
  cover: string;
  url?: string;
  sourceUrl?: string;
  externalUrl?: string;
  officialUrl?: string;
  pvUrl?: string;
  status: "want" | "watching" | "watched";
  total?: number;
  progress?: number;
  score?: number;
  myScore?: number;
  desc?: string;
  airDate?: string;
  airTime?: string;
  broadcast?: string;
  type?: string;
  tags?: string[];
  source?: string;
  comment?: string;
}

interface AnimeData {
  watching: AnimeItem[];
  watched: AnimeItem[];
  want: AnimeItem[];
  lastUpdate: string;
}

type TabKey = "watching" | "watched" | "want";

// ─── 数据加载 ───────────────────────────────────────────

const animeData = ref<AnimeData>({
  watching: [],
  watched: [],
  want: [],
  lastUpdate: "",
});
const loaded = ref(false);
const loadError = ref(false);

onMounted(async () => {
  try {
    const resp = await fetch("/data/anime-data.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    animeData.value = await resp.json();
    loaded.value = true;
  } catch {
    loadError.value = true;
  }
});

// ─── 合并全部条目 ───────────────────────────────────────

const allItems = computed(() => [
  ...animeData.value.watching,
  ...animeData.value.watched,
  ...animeData.value.want,
]);

// ─── 时间轴分组 ───────────────────────────────────────────

interface MonthGroup {
  month: number;
  monthLabel: string;
  items: AnimeItem[];
}

interface YearGroup {
  year: number;
  yearLabel: string;
  months: MonthGroup[];
}

const timeline = computed<YearGroup[]>(() => {
  const yearMap = new Map<number, Map<number, AnimeItem[]>>();

  for (const item of allItems.value) {
    const date = item.airDate ?? "";
    let year = 0;
    let month = 0;

    const match = date.match(/^(\d{4})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
    }

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const mMap = yearMap.get(year)!;
    if (!mMap.has(month)) mMap.set(month, []);
    mMap.get(month)!.push(item);
  }

  // 年份倒序
  return [...yearMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, mMap]) => ({
      year,
      yearLabel: year === 0 ? "未归档" : String(year),
      // 月份倒序
      months: [...mMap.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, items]) => ({
          month,
          monthLabel: month === 0 ? "" : `${month} 月`,
          items,
        })),
    }));
});

// ─── 辅助函数 ─────────────────────────────────────────────

function progressText(item: AnimeItem): string {
  if (item.broadcast) return item.broadcast;
  if (item.total && item.total > 0) {
    const p = item.progress ?? 0;
    return item.status === "watched" ? `全 ${p} 话` : `${p} / ${item.total}`;
  }
  return "";
}

function starClass(n: number, myScore: number): string {
  return n <= Math.round(myScore / 2) ? "filled" : "";
}

function coverPlaceholder(item: AnimeItem): string {
  // 数据驱动的占位：取标题首字
  return item.title.slice(0, 1);
}
</script>

<template>
  <div class="anime-timeline" aria-label="追番时间轴">

    <!-- 加载 / 错误状态 -->
    <div v-if="!loaded && !loadError" class="anime-empty">
      <p>加载中…</p>
    </div>

    <div v-else-if="loadError" class="anime-empty">
      <p>数据加载失败，请稍后刷新页面</p>
    </div>

    <div v-else-if="allItems.length === 0" class="anime-empty">
      <p>暂无数据</p>
    </div>

    <!-- 时间轴 -->
    <div v-else class="anime-timeline-body">
      <section
        v-for="yearGroup in timeline"
        :key="yearGroup.year"
        class="anime-year-group"
      >
        <h2 class="anime-year-heading">{{ yearGroup.yearLabel }}</h2>

        <div
          v-for="monthGroup in yearGroup.months"
          :key="`${yearGroup.year}-${monthGroup.month}`"
          class="anime-month-group"
        >
          <h3 v-if="monthGroup.monthLabel" class="anime-month-heading">
            {{ monthGroup.monthLabel }}
          </h3>

          <!-- 卡片 -->
          <article
            v-for="item in monthGroup.items"
            :key="item.id"
            class="anime-card"
          >
            <!-- 封面 -->
            <div class="anime-card-cover">
              <img
                v-if="item.cover"
                :src="item.cover"
                :alt="`${item.title} 封面`"
                loading="lazy"
                @error="(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }"
              />
              <div class="anime-card-cover-fallback hidden">
                {{ coverPlaceholder(item) }}
              </div>
            </div>

            <!-- 信息区 -->
            <div class="anime-card-body">

              <!-- 标签行：类型 + 进度 -->
              <div class="anime-card-meta-top">
                <span v-if="item.type" class="anime-type-tag">{{ item.type }}</span>
                <span v-if="progressText(item)" class="anime-progress-tag">{{ progressText(item) }}</span>
              </div>

              <!-- 标题 -->
              <h4 class="anime-card-title">
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
                <span v-else>{{ item.title }}</span>
              </h4>
              <p v-if="item.originalTitle" class="anime-card-subtitle">{{ item.originalTitle }}</p>

              <!-- 描述 -->
              <p v-if="item.desc" class="anime-card-desc">{{ item.desc }}</p>

              <!-- 评分 -->
              <div v-if="item.myScore" class="anime-card-rating">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="star"
                  :class="starClass(n, item.myScore)"
                >★</span>
                <span class="rating-num">{{ item.myScore }}</span>
              </div>

              <!-- 外部评分 -->
              <div v-else-if="item.score" class="anime-card-rating">
                <span class="rating-label">Bangumi</span>
                <span class="rating-num dim">{{ item.score }}</span>
              </div>

              <!-- 标签 -->
              <div v-if="item.tags?.length" class="anime-card-tags">
                <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>

              <!-- 备注 -->
              <p v-if="item.comment" class="anime-card-comment">{{ item.comment }}</p>

              <!-- 外部链接 -->
              <div v-if="item.officialUrl || item.pvUrl || item.externalUrl" class="anime-card-links">
                <a v-if="item.officialUrl" :href="item.officialUrl" target="_blank" rel="noopener noreferrer">官网</a>
                <a v-if="item.pvUrl" :href="item.pvUrl" target="_blank" rel="noopener noreferrer">PV</a>
                <a v-if="item.externalUrl" :href="item.externalUrl" target="_blank" rel="noopener noreferrer">详情</a>
              </div>

              <!-- 数据来源 -->
              <div v-if="item.source" class="anime-card-source">
                数据来源：{{ item.source }}
              </div>

            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- 最后更新时间 -->
    <div v-if="animeData.lastUpdate" class="anime-footer">
      <span>最后同步：{{ new Date(animeData.lastUpdate).toLocaleDateString("zh-CN") }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── 全局容器 ────────────────────────────────────────── */

.anime-timeline {
  max-width: 100%;
  margin-top: 1rem;
}

/* ── 空状态 ──────────────────────────────────────────── */

.anime-empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--lu-muted);
  font-size: 0.95rem;
}

/* ── 年份标题 ────────────────────────────────────────── */

.anime-year-heading {
  font-family: var(--lu-display);
  font-size: clamp(1.7rem, 3vw, 2.2rem);
  font-weight: 700;
  color: var(--lu-ink);
  margin: 2rem 0 0.6rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--lu-border);
  letter-spacing: -0.02em;
}

/* ── 月份标题 ────────────────────────────────────────── */

.anime-month-heading {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--lu-muted);
  margin: 1rem 0 0.6rem;
  padding-left: 0.5rem;
  border-left: 2px solid var(--lu-accent);
}

/* ── 卡片 ────────────────────────────────────────────── */

.anime-card {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.9rem;
  padding: 0.9rem;
  border: 1px solid var(--lu-border);
  border-radius: 20px;
  background: var(--lu-surface-strong);
  box-shadow: var(--lu-shadow);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:last-child { margin-bottom: 0; }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(77, 141, 255, 0.32);
    box-shadow: var(--lu-shadow-strong);
  }
}

/* ── 封面 ────────────────────────────────────────────── */

.anime-card-cover {
  flex-shrink: 0;
  width: 140px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(114, 130, 171, 0.08);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.anime-card-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--lu-display);
  font-size: 2rem;
  color: var(--lu-muted);
  border-radius: 3px;
  background: rgba(114, 130, 171, 0.06);

  &.hidden { display: none; }
}

/* ── 信息区 ──────────────────────────────────────────── */

.anime-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

/* ── 顶部标签行 ──────────────────────────────────────── */

.anime-card-meta-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.1rem;
}

.anime-type-tag,
.anime-progress-tag {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.anime-type-tag {
  background: rgba(114, 130, 171, 0.08);
  color: var(--lu-muted);
}
.anime-progress-tag {
  background: rgba(86, 196, 138, 0.1);
  color: #38a169;
}

/* ── 标题 ────────────────────────────────────────────── */

.anime-card-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--lu-ink);

  a {
    color: inherit;
    text-decoration: none;
    &:hover { color: var(--lu-hover-blue); }
  }
}

.anime-card-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: var(--lu-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 描述 ────────────────────────────────────────────── */

.anime-card-desc {
  margin: 0;
  font-size: 0.84rem;
  color: var(--lu-ink-soft);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 评分 ────────────────────────────────────────────── */

.anime-card-rating {
  display: flex;
  align-items: center;
  gap: 0.12rem;

  .star {
    font-size: 0.85rem;
    color: rgba(114, 130, 171, 0.18);
    &.filled { color: #f0b429; }
  }

  .rating-num {
    margin-left: 0.3rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--lu-ink);

    &.dim { color: var(--lu-muted); }
  }
}
.rating-label {
  font-size: 0.72rem;
  color: var(--lu-muted);
}

/* ── 标签 ────────────────────────────────────────────── */

.anime-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  .tag {
    padding: 0.1rem 0.5rem;
    border: 1px solid var(--lu-border);
    border-radius: 999px;
    font-size: 0.7rem;
    color: var(--lu-muted);
  }
}

/* ── 备注 ────────────────────────────────────────────── */

.anime-card-comment {
  margin: 0;
  font-size: 0.8rem;
  color: var(--lu-muted);
  font-style: italic;
}

/* ── 外部链接 ────────────────────────────────────────── */

.anime-card-links {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.15rem;

  a {
    font-size: 0.78rem;
    color: var(--lu-accent-strong);
    text-decoration: none;
    &:hover { color: var(--lu-hover-blue); }
  }
}

/* ── 数据来源 ────────────────────────────────────────── */

.anime-card-source {
  margin-top: 0.3rem;
  font-size: 0.72rem;
  color: var(--lu-muted);
}

/* ── 页脚 ────────────────────────────────────────────── */

.anime-footer {
  margin-top: 2rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--lu-border);
  text-align: center;
  font-size: 0.78rem;
  color: var(--lu-muted);
}

/* ── 移动端 ──────────────────────────────────────────── */

@media (max-width: 768px) {
  .anime-card-cover {
    width: 110px;
  }

  .anime-card {
    gap: 0.7rem;
    padding: 0.7rem;
    border-radius: 16px;
  }

  .anime-card-title {
    font-size: 0.98rem;
  }

  .anime-card-desc {
    -webkit-line-clamp: 2;
  }
}
</style>
