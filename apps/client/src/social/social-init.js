import { hasAuthToken, pingPresence } from "./social-api.js";
import { initFriendsNav, initFriendsPanel } from "./social-friends-panel.js";
import { syncSocialNavAuthState } from "./social-nav-state.js";
import { initSocialNotifications, syncSocialHeaderVisibility } from "./social-notifications.js";

let presenceTimer;

function startPresence() {
  if (presenceTimer) return;
  if (!hasAuthToken()) return;
  void pingPresence();
  presenceTimer = window.setInterval(() => void pingPresence(), 55000);
}

function stopPresence() {
  if (presenceTimer) window.clearInterval(presenceTimer);
  presenceTimer = undefined;
}

/**
 * @param {{ categoriesOnly?: boolean }} [opts]
 * categories.html: bell + notifications only (no friends overlay).
 */
export function initSocialFeatures(opts = {}) {
  initSocialNotifications();
  initFriendsNav();
  if (!opts.categoriesOnly) initFriendsPanel();
  syncSocialHeaderVisibility();
  syncSocialNavAuthState();
  if (hasAuthToken()) startPresence();
  window.addEventListener("riffle-auth-changed", () => {
    syncSocialHeaderVisibility();
    syncSocialNavAuthState();
    if (hasAuthToken()) startPresence();
    else stopPresence();
  });
}
