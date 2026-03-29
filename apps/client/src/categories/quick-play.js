import { gameMode } from "./state.js";

/** Versus / Team VS / Co-op: fixed match rules; only categories (+ team sizes) are customized. */
export const QUICK_PLAY_MODES = Object.freeze(["versus", "team", "coop"]);

export const QUICK_PLAY_FIXED_BY_MODE = Object.freeze({
  versus: Object.freeze({
    rounds: "10",
    timeLimit: 15,
    answerVisibility: "visible",
    bannerKey: "categoriesPage.quickBannerVersus",
  }),
  coop: Object.freeze({
    rounds: "12",
    timeLimit: 20,
    answerVisibility: "visible",
    bannerKey: "categoriesPage.quickBannerCoop",
  }),
  team: Object.freeze({
    rounds: "15",
    timeLimit: 12,
    answerVisibility: "hidden",
    bannerKey: "categoriesPage.quickBannerTeam",
  }),
});

export function isQuickPlayMode() {
  return QUICK_PLAY_MODES.includes(gameMode);
}

export function getQuickPlayFixed(mode = gameMode) {
  return QUICK_PLAY_FIXED_BY_MODE[mode] || QUICK_PLAY_FIXED_BY_MODE.versus;
}
