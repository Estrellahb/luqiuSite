import { computed, ref, type Ref } from 'vue';

export interface SteamGame {
  appid: number;
  name: string;
  playtimeMinutes: number;
  cover?: string;
  fallbackCover?: string;
  url?: string;
}
export interface WatchedAnime {
  id: string;
  title: string;
  cover: string;
  url?: string;
  updatedAt?: string;
}
export const sortGames = <T extends SteamGame>(games: T[]): T[] =>
  games.filter(game => Number.isFinite(game.playtimeMinutes) && game.playtimeMinutes > 0)
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes || a.appid - b.appid);
const timestamp = (value?: string) => Date.parse(value ?? '') || 0;
export const sortAnime = <T extends WatchedAnime>(anime: T[]): T[] =>
  [...anime].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt) || a.id.localeCompare(b.id));
export const useMediaColumn = <T>(items: Ref<T[]>) => {
  const expanded = ref(false);
  const visible = computed(() => expanded.value ? items.value : items.value.slice(0, 8));
  const toggle = () => { expanded.value = !expanded.value; };
  return { expanded, visible, toggle };
};
