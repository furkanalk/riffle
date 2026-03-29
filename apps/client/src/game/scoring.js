/** Reference answer window (seconds): at this setting, max points at t=0 equal BASE_MAX. */
const REFERENCE_SEC = 15;
const BASE_MAX = 100;
/** Minimum fraction of max points when answering at the buzzer. */
const MIN_TIME_FRACTION = 0.1;
const MIN_WINDOW = 3;
const MAX_WINDOW = 60;

export function clampAnswerWindowSec(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return REFERENCE_SEC;
  return Math.min(MAX_WINDOW, Math.max(MIN_WINDOW, n));
}

/** Max points for an instant correct answer (before within-round decay). */
export function maxPointsForWindow(answerWindowSec) {
  const T = clampAnswerWindowSec(answerWindowSec);
  return (BASE_MAX * REFERENCE_SEC) / T;
}

/**
 * Points for a correct answer from elapsed time in the answer window.
 * Shorter global time limits raise the cap; answering later in the round lowers points.
 */
export function computeAnswerPoints(elapsedMs, answerWindowSec) {
  const T = clampAnswerWindowSec(answerWindowSec);
  const maxPts = maxPointsForWindow(T);
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  const clampedElapsed = Math.min(T, elapsedSec);
  const timeRatio = 1 - clampedElapsed / T;
  const factor = Math.max(MIN_TIME_FRACTION, timeRatio);
  return Math.max(1, Math.round(maxPts * factor));
}
