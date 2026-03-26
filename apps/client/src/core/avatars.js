/** @type {readonly string[]} */
export const AVATAR_IDS = Object.freeze(
  Array.from({ length: 10 }, (_, i) => `avatar${i + 1}`)
);

/**
 * Daily rotating guest avatar set (3 avatars).
 * Deterministic by UTC date so all guests see same 3 each day.
 */
export function getDailyGuestAvatarIds(date = new Date()) {
  const daySeed = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const decorated = AVATAR_IDS.map((id, idx) => {
    // Lightweight deterministic shuffle key based on day + index.
    const key = ((daySeed / 86400000 + 1) * (idx + 37) * 2654435761) % 1000003;
    return { id, key };
  }).sort((a, b) => a.key - b.key);
  return Object.freeze(decorated.slice(0, 3).map((x) => x.id));
}

/** Non-featured avatars (registered users still see all avatars). */
export function getDailyLockedAvatarIds(date = new Date()) {
  const guest = new Set(getDailyGuestAvatarIds(date));
  return Object.freeze(AVATAR_IDS.filter((id) => !guest.has(id)));
}

export const DEFAULT_AVATAR_ID = "avatar1";

/** @param {unknown} id */
export function isValidAvatarId(id) {
  return typeof id === "string" && AVATAR_IDS.includes(id);
}

/** Path relative to the page that loads the client (index / categories / game). */
export function avatarImgSrcFromRoot(id) {
  return `./src/img/avatars/${id}.png`;
}
