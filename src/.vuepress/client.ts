import { defineClientConfig } from "vuepress/client";

import AnimeTimeline from "./components/AnimeTimeline.vue";

export default defineClientConfig({
  enhance({ app }) {
    app.component("AnimeTimeline", AnimeTimeline);
  },
});
