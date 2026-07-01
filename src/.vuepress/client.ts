import { nextTick, onMounted } from "vue";
import { defineClientConfig } from "vuepress/client";

import AnimeTimeline from "./components/AnimeTimeline.vue";

const HOME_TITLE_TEXT = "晴耕雨读秋收冬藏";
const HERO_TITLE_SELECTOR = ".vp-blog-hero-title, .vp-hero-title";

const revealHomeHeroTitle = () => {
  const title = document.querySelector<HTMLElement>(HERO_TITLE_SELECTOR);

  if (!title) return;

  const text = title.dataset.luTitleText ?? title.textContent?.trim();

  if (!text || text !== HOME_TITLE_TEXT) return;

  const spans = title.querySelectorAll<HTMLElement>(".lu-title-char");

  if (title.dataset.luCharReveal === "true" && spans.length === text.length) {
    spans[3]?.classList.add("lu-title-gap-after");
    return;
  }

  title.dataset.luCharReveal = "true";
  title.dataset.luTitleText = text;
  title.setAttribute("aria-label", text);
  title.textContent = "";

  Array.from(text).forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "lu-title-char";
    if (index === 3) span.classList.add("lu-title-gap-after");
    span.textContent = char;
    span.setAttribute("aria-hidden", "true");
    span.style.setProperty("--lu-char-index", String(index));
    title.appendChild(span);
  });
};

const scheduleRevealHomeHeroTitle = () => {
  void nextTick(() => {
    requestAnimationFrame(revealHomeHeroTitle);
  });
};

export default defineClientConfig({
  enhance({ app }) {
    app.component("AnimeTimeline", AnimeTimeline);
  },

  setup() {
    onMounted(() => {
      scheduleRevealHomeHeroTitle();

      document.addEventListener("visibilitychange", scheduleRevealHomeHeroTitle);
      window.addEventListener("focus", scheduleRevealHomeHeroTitle);
      window.addEventListener("pageshow", scheduleRevealHomeHeroTitle);

      const observer = new MutationObserver(() => {
        scheduleRevealHomeHeroTitle();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  },
});
