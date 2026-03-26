import { gameMode } from "./state.js";

/** Versus / Team VS / Co-op: fixed match rules; only categories (+ team sizes) are customized. */
export const QUICK_PLAY_MODES = Object.freeze(["versus", "team", "coop"]);

export const QUICK_PLAY_FIXED_BY_MODE = Object.freeze({
  versus: Object.freeze({
    rounds: "10",
    timeLimit: 15,
    answerVisibility: "visible",
    banner: "Solo VS: 10 questions · 15s · live answers",
  }),
  coop: Object.freeze({
    rounds: "12",
    timeLimit: 20,
    answerVisibility: "visible",
    banner: "Co-op: 12 questions · 20s · collaborate and climb",
  }),
  team: Object.freeze({
    rounds: "15",
    timeLimit: 12,
    answerVisibility: "hidden",
    banner: "Team VS: 15 questions · 12s · answers revealed at round end",
  }),
});

export function isQuickPlayMode() {
  return QUICK_PLAY_MODES.includes(gameMode);
}

export function getQuickPlayFixed(mode = gameMode) {
  return QUICK_PLAY_FIXED_BY_MODE[mode] || QUICK_PLAY_FIXED_BY_MODE.versus;
}
