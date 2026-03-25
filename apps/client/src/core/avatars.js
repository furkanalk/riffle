/** @type {readonly string[]} */
export const AVATAR_IDS = Object.freeze(
  Array.from({ length: 10 }, (_, i) => `avatar${i + 1}`)
);

export const DEFAULT_AVATAR_ID = "avatar1";

/** @param {unknown} id */
export function isValidAvatarId(id) {
  return typeof id === "string" && AVATAR_IDS.includes(id);
}

/** Path relative to the page that loads the client (index / categories / game). */
export function avatarImgSrcFromRoot(id) {
  return `./src/img/avatars/${id}.png`;
}
