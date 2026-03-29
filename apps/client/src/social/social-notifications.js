import {
  acceptFriendRequest,
  hasAuthToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./social-api.js";
import { applyDataRiffleI18n, getLang, t, tVar } from "../core/i18n.js";
import { isSocialGuest, maybeShowGuestSocialHint } from "./social-nav-state.js";
import { showSocialToast } from "./social-toast.js";

let pollTimer;
/** @type {number | null} */
let lastUnread = null;

function navigateJoinPath(joinPath) {
  try {
    const u = new URL(joinPath, window.location.origin);
    window.location.href = `${u.pathname}${u.search}${u.hash}`;
  } catch {
    window.location.href = `./${joinPath.replace(/^\//, "")}`;
  }
}

function updateBadge(count) {
  const badge = document.getElementById("notif-bell-badge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : String(count);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

export async function refreshNotifications({ silent } = {}) {
  if (!hasAuthToken()) {
    updateBadge(0);
    return null;
  }
  try {
    const data = await listNotifications();
    const unread = data.unreadCount ?? 0;
    if (lastUnread !== null && !silent && unread > lastUnread) {
      showSocialToast(t("notifications.toastNew", getLang()));
    }
    lastUnread = unread;
    updateBadge(unread);
    return data;
  } catch {
    return null;
  }
}

function renderDropdown(data) {
  const body = document.getElementById("notif-dropdown-body");
  const empty = document.getElementById("notif-dropdown-empty");
  if (!body || !empty) return;

  const lang = getLang();
  const list = data?.notifications || [];
  body.innerHTML = "";
  if (list.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  for (const n of list) {
    const row = document.createElement("div");
    row.className = `notif-item${n.read_at ? "" : " notif-item--unread"}`;

    const title = document.createElement("div");
    title.className = "notif-item__title";
    const from = n.from_username || t("notifications.someone", lang);
    if (n.type === "friend_request") {
      title.textContent = tVar("notifications.friendRequest", { name: from }, lang);
    } else if (n.type === "friend_accepted") {
      title.textContent = tVar("notifications.friendAccepted", { name: from }, lang);
    } else if (n.type === "room_invite") {
      title.textContent = tVar("notifications.roomInvite", { name: from }, lang);
    } else {
      title.textContent = t("notifications.generic", lang);
    }

    const meta = document.createElement("div");
    meta.className = "notif-item__meta";
    const t = new Date(n.created_at);
    meta.textContent = Number.isNaN(t.getTime()) ? "" : t.toLocaleString();

    const actions = document.createElement("div");
    actions.className = "notif-item__actions";

    if (n.type === "friend_request" && n.payload?.requestId != null) {
      const rid = Number(n.payload.requestId);
      const accept = document.createElement("button");
      accept.type = "button";
      accept.className = "btn btn--primary notif-item__btn";
      accept.textContent = t("notifications.accept", lang);
      accept.addEventListener("click", async () => {
        try {
          await acceptFriendRequest(rid);
          await markNotificationRead(n.id);
          showSocialToast(t("notifications.toastFriends", getLang()));
          const dataFresh = await refreshNotifications({ silent: true });
          if (dataFresh) renderDropdown(dataFresh);
        } catch (e) {
          showSocialToast(e instanceof Error ? e.message : t("notifications.toastCouldNotAccept", getLang()));
        }
      });
      actions.appendChild(accept);
    }

    if (n.type === "room_invite" && n.payload?.joinPath) {
      const join = document.createElement("button");
      join.type = "button";
      join.className = "btn btn--ghost notif-item__btn";
      join.textContent = t("notifications.joinLobby", lang);
      join.addEventListener("click", async () => {
        try {
          await markNotificationRead(n.id);
        } catch {
          /* ignore */
        }
        navigateJoinPath(String(n.payload.joinPath));
      });
      actions.appendChild(join);
    }

    row.appendChild(title);
    row.appendChild(meta);
    if (actions.childNodes.length) row.appendChild(actions);
    body.appendChild(row);
  }
}

function isMobileNotifViewport() {
  return window.matchMedia("(max-width: 640px)").matches;
}

function setNotifSheetOpen(open) {
  if (open) document.body.classList.add("notif-sheet-open");
  else document.body.classList.remove("notif-sheet-open");
}

/** Dropdown is under `body`; desktop anchors to bell (avoids header backdrop-filter clipping). */
function clearNotifDropdownPosition() {
  const panel = document.getElementById("notif-dropdown");
  if (!panel) return;
  panel.style.removeProperty("--notif-dd-top");
  panel.style.removeProperty("--notif-dd-right");
}

function syncNotifDropdownPosition() {
  const panel = document.getElementById("notif-dropdown");
  const bell = document.getElementById("notif-bell-btn");
  if (!panel || !bell || panel.classList.contains("hidden")) return;
  if (isMobileNotifViewport()) {
    clearNotifDropdownPosition();
    return;
  }
  const r = bell.getBoundingClientRect();
  const gap = 6;
  panel.style.setProperty("--notif-dd-top", `${Math.round(r.bottom + gap)}px`);
  panel.style.setProperty("--notif-dd-right", `${Math.round(window.innerWidth - r.right)}px`);
}

async function openDropdown() {
  const panel = document.getElementById("notif-dropdown");
  const bell = document.getElementById("notif-bell-btn");
  const backdrop = document.getElementById("notif-dropdown-backdrop");
  if (!panel) return;
  panel.classList.remove("hidden");
  syncNotifDropdownPosition();
  bell?.setAttribute("aria-expanded", "true");
  if (isMobileNotifViewport()) {
    backdrop?.classList.remove("hidden");
    setNotifSheetOpen(true);
  }
  const data = await refreshNotifications({ silent: true });
  if (data) renderDropdown(data);
  syncNotifDropdownPosition();
}

function closeDropdown() {
  const panel = document.getElementById("notif-dropdown");
  const bell = document.getElementById("notif-bell-btn");
  const backdrop = document.getElementById("notif-dropdown-backdrop");
  panel?.classList.add("hidden");
  clearNotifDropdownPosition();
  bell?.setAttribute("aria-expanded", "false");
  backdrop?.classList.add("hidden");
  setNotifSheetOpen(false);
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => refreshNotifications({ silent: true }), 28000);
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = undefined;
  lastUnread = null;
}

export function initSocialNotifications() {
  if (window.__riffleNotifUiInit) return;
  window.__riffleNotifUiInit = true;

  const bell = document.getElementById("notif-bell-btn");
  const panel = document.getElementById("notif-dropdown");
  const markAll = document.getElementById("notif-mark-all-read");

  bell?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isSocialGuest()) {
      showSocialToast(t("social.guestPrompt", getLang()));
      return;
    }
    if (!panel) return;
    const open = !panel.classList.contains("hidden");
    if (open) closeDropdown();
    else void openDropdown();
  });

  bell?.addEventListener("mouseenter", () => {
    if (isSocialGuest()) maybeShowGuestSocialHint();
  });

  markAll?.addEventListener("click", async () => {
    try {
      await markAllNotificationsRead();
      const data = await listNotifications();
      lastUnread = data.unreadCount ?? 0;
      updateBadge(lastUnread);
      renderDropdown(data);
    } catch {
      showSocialToast(t("notifications.toastUpdateFailed", getLang()));
    }
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Node)) return;
    const backdrop = document.getElementById("notif-dropdown-backdrop");
    if (bell?.contains(t) || panel?.contains(t) || backdrop?.contains(t)) return;
    closeDropdown();
  });

  document.getElementById("notif-dropdown-backdrop")?.addEventListener("click", () => {
    closeDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      syncNotifDropdownPosition();
    });
  });

  window.matchMedia("(max-width: 640px)").addEventListener("change", (ev) => {
    if (!ev.matches) {
      document.getElementById("notif-dropdown-backdrop")?.classList.add("hidden");
      setNotifSheetOpen(false);
    }
    syncNotifDropdownPosition();
  });

  window.addEventListener("riffle-lang-changed", () => {
    const lang = getLang();
    applyDataRiffleI18n(document, lang);
    void refreshNotifications({ silent: true }).then((data) => {
      if (data) renderDropdown(data);
    });
  });
}

export function syncSocialHeaderVisibility() {
  const wrap = document.getElementById("social-header-chrome");
  wrap?.classList.remove("hidden");
  if (hasAuthToken()) {
    void refreshNotifications({ silent: true });
    startPolling();
  } else {
    updateBadge(0);
    closeDropdown();
    stopPolling();
  }
}
