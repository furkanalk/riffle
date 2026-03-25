import { gameMode } from "./state.js";

/** Versus / Team VS / Co-op: fixed match rules; only categories (+ team sizes) are customized. */
export const QUICK_PLAY_MODES = Object.freeze(["versus", "team", "coop"]);

export const QUICK_PLAY_FIXED = Object.freeze({
  rounds: "10",
  timeLimit: 15,
  answerVisibility: "visible",
});

export function isQuickPlayMode() {
  return QUICK_PLAY_MODES.includes(gameMode);
}
