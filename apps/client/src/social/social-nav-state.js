import { getLang, t } from "../core/i18n.js";
import { hasAuthToken } from "./social-api.js";
import { showSocialToast } from "./social-toast.js";

export function isSocialGuest() {
  return !hasAuthToken();
}

let lastGuestHintAt = 0;
const GUEST_HINT_COOLDOWN_MS = 3500;

/** Desktop hover: toast at most once per cooldown (shared for friends + bell). */
export function maybeShowGuestSocialHint() {
  if (!isSocialGuest()) return;
  const now = Date.now();
  if (now - lastGuestHintAt < GUEST_HINT_COOLDOWN_MS) return;
  lastGuestHintAt = now;
  showSocialToast(t("social.guestPrompt", getLang()));
}

/** Sync disabled look + tooltips for friends + notification icons. */
export function syncSocialNavAuthState() {
  const authed = hasAuthToken();
  const friendsBtn = document.getElementById("friends-nav-btn");
  const bell = document.getElementById("notif-bell-btn");
  const chrome = document.getElementById("social-header-chrome");

  chrome?.classList.remove("hidden");

  const lang = getLang();
  if (friendsBtn) {
    friendsBtn.classList.toggle("social-nav-btn--disabled", !authed);
    friendsBtn.setAttribute("aria-disabled", authed ? "false" : "true");
    friendsBtn.title = authed ? t("social.friendsTitle", lang) : t("social.guestPrompt", lang);
    friendsBtn.setAttribute(
      "aria-label",
      authed ? t("social.friendsTitle", lang) : t("social.guestPrompt", lang)
    );
  }
  if (bell) {
    bell.classList.toggle("social-nav-btn--disabled", !authed);
    bell.setAttribute("aria-disabled", authed ? "false" : "true");
    bell.title = authed ? t("social.notificationsTitle", lang) : t("social.guestPrompt", lang);
    bell.setAttribute(
      "aria-label",
      authed ? t("social.notificationsTitle", lang) : t("social.guestPrompt", lang)
    );
  }
}
