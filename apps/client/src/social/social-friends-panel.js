import { getLang, t } from "../core/i18n.js";
import { avatarImgSrcFromRoot, DEFAULT_AVATAR_ID, normalizeAvatarId } from "../core/avatars.js";
import {
  acceptFriendRequest,
  declineFriendRequest,
  hasAuthToken,
  listFriendRequests,
  listFriends,
  searchUsers,
  sendFriendRequest,
} from "./social-api.js";
import { maybeShowGuestSocialHint } from "./social-nav-state.js";
import { showSocialToast } from "./social-toast.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

function setTab(name) {
  document.querySelectorAll("[data-friends-tab]").forEach((btn) => {
    const on = btn.getAttribute("data-friends-tab") === name;
    btn.classList.toggle("friends-tab--active", on);
  });
  document.querySelectorAll("[data-friends-panel]").forEach((p) => {
    p.classList.toggle("hidden", p.getAttribute("data-friends-panel") !== name);
  });
}

async function loadFriendsLists() {
  const lang = getLang();
  const onlineEl = document.getElementById("friends-list-online");
  const offlineEl = document.getElementById("friends-list-offline");
  if (!onlineEl || !offlineEl) return;
  onlineEl.innerHTML = "";
  offlineEl.innerHTML = "";
  try {
    const friends = await listFriends();
    const on = friends.filter((f) => f.online);
    const off = friends.filter((f) => !f.online);
    const render = (list, container, emptyMsg) => {
      if (list.length === 0) {
        container.innerHTML = `<p class="friends-empty">${emptyMsg}</p>`;
        return;
      }
      for (const f of list) {
        const row = document.createElement("div");
        row.className = "friends-row";
        const av = normalizeAvatarId(f.avatar || DEFAULT_AVATAR_ID);
        const dot = f.online ? "friends-row__dot--on" : "friends-row__dot--off";
        const st = f.online ? t("friends.online", lang) : t("friends.offline", lang);
        row.innerHTML = `
          <span class="friends-row__dot ${dot}" aria-hidden="true"></span>
          <img class="friends-row__avatar" src="${avatarImgSrcFromRoot(av)}" alt="" width="32" height="32" />
          <span class="friends-row__name">${escapeHtml(f.username)}</span>
          <span class="friends-row__status">${escapeHtml(st)}</span>
        `;
        container.appendChild(row);
      }
    };
    render(on, onlineEl, t("friendsUi.emptyOnline", lang));
    render(off, offlineEl, t("friendsUi.emptyOffline", lang));
  } catch (e) {
    onlineEl.innerHTML = `<p class="friends-empty">${escapeHtml(e instanceof Error ? e.message : t("friendsUi.loadError", lang))}</p>`;
    offlineEl.innerHTML = "";
  }
}

async function loadRequests() {
  const lang = getLang();
  const el = document.getElementById("friends-requests-list");
  if (!el) return;
  el.innerHTML = "";
  try {
    const requests = await listFriendRequests();
    if (requests.length === 0) {
      el.innerHTML = `<p class="friends-empty">${escapeHtml(t("friendsUi.noPendingRequests", lang))}</p>`;
      return;
    }
    for (const r of requests) {
      const row = document.createElement("div");
      row.className = "friends-request-row";
      const av = normalizeAvatarId(r.avatar || DEFAULT_AVATAR_ID);
      row.innerHTML = `
        <img class="friends-row__avatar" src="${avatarImgSrcFromRoot(av)}" alt="" width="32" height="32" />
        <span class="friends-row__name">${escapeHtml(r.username)}</span>
        <button type="button" class="btn btn--primary friends-mini-btn" data-accept="${r.id}">${escapeHtml(t("friendsUi.accept", lang))}</button>
        <button type="button" class="btn btn--ghost friends-mini-btn" data-decline="${r.id}">${escapeHtml(t("friendsUi.decline", lang))}</button>
      `;
      el.appendChild(row);
    }
    el.querySelectorAll("[data-accept]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-accept"));
        try {
          await acceptFriendRequest(id);
          showSocialToast(t("friendsUi.friendAdded", lang));
          await loadRequests();
          await loadFriendsLists();
        } catch (err) {
          showSocialToast(err instanceof Error ? err.message : t("friendsUi.failed", lang));
        }
      });
    });
    el.querySelectorAll("[data-decline]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-decline"));
        try {
          await declineFriendRequest(id);
          await loadRequests();
        } catch (err) {
          showSocialToast(err instanceof Error ? err.message : t("friendsUi.failed", lang));
        }
      });
    });
  } catch (e) {
    el.innerHTML = `<p class="friends-empty">${escapeHtml(e instanceof Error ? e.message : t("friendsUi.loadError", lang))}</p>`;
  }
}

const runSearch = debounce(async () => {
  const lang = getLang();
  const input = document.getElementById("friends-search-input");
  const out = document.getElementById("friends-search-results");
  if (!input || !out) return;
  const q = input.value.trim();
  if (q.length < 2) {
    out.innerHTML = "";
    return;
  }
  out.innerHTML = `<p class="friends-empty">${escapeHtml(t("friendsUi.searching", lang))}</p>`;
  try {
    const users = await searchUsers(q);
    out.innerHTML = "";
    if (users.length === 0) {
      out.innerHTML = `<p class="friends-empty">${escapeHtml(t("friendsUi.noUsersFound", lang))}</p>`;
      return;
    }
    for (const u of users) {
      const row = document.createElement("div");
      row.className = "friends-search-row";
      const av = normalizeAvatarId(u.avatar || DEFAULT_AVATAR_ID);
      let action = "";
      if (u.friendStatus === "friend")
        action = `<span class="friends-tag">${escapeHtml(t("friendsUi.tagFriends", lang))}</span>`;
      else if (u.friendStatus === "pending_out")
        action = `<span class="friends-tag">${escapeHtml(t("friendsUi.tagRequestSent", lang))}</span>`;
      else if (u.friendStatus === "pending_in")
        action = `<span class="friends-tag">${escapeHtml(t("friendsUi.tagWantsFriends", lang))}</span>`;
      else
        action = `<button type="button" class="btn btn--primary friends-mini-btn" data-add="${u.id}">${escapeHtml(t("friendsUi.add", lang))}</button>`;

      row.innerHTML = `
        <img class="friends-row__avatar" src="${avatarImgSrcFromRoot(av)}" alt="" width="32" height="32" />
        <span class="friends-row__name">${escapeHtml(u.username)}</span>
        <span class="friends-search-row__action">${action}</span>
      `;
      const addBtn = row.querySelector("[data-add]");
      addBtn?.addEventListener("click", async () => {
        try {
          const res = await sendFriendRequest(u.id);
          if (res.autoAccepted) showSocialToast(t("friendsUi.toastNowFriends", lang));
          else showSocialToast(t("friendsUi.toastRequestSent", lang));
          runSearch();
        } catch (err) {
          showSocialToast(err instanceof Error ? err.message : t("friendsUi.couldNotSend", lang));
        }
      });
      out.appendChild(row);
    }
  } catch (e) {
    out.innerHTML = `<p class="friends-empty">${escapeHtml(e instanceof Error ? e.message : t("friendsUi.searchFailed", lang))}</p>`;
  }
}, 320);

export function openFriendsPanel() {
  if (!hasAuthToken()) {
    showSocialToast(t("social.guestPrompt", getLang()));
    return;
  }
  const panel = document.getElementById("friends-panel");
  if (!panel) return;
  document.getElementById("profile-panel")?.classList.add("hidden");
  panel.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  setTab("find");
  void loadFriendsLists();
  void loadRequests();
}

export function closeFriendsPanel() {
  const panel = document.getElementById("friends-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

export function tryConsumeOpenFriendsIntent() {
  if (sessionStorage.getItem("riffle_open_friends") !== "1") return;
  sessionStorage.removeItem("riffle_open_friends");
  if (!hasAuthToken()) return;
  openFriendsPanel();
}

export function initFriendsNav() {
  if (window.__riffleFriendsNavInit) return;
  window.__riffleFriendsNavInit = true;

  const btn = document.getElementById("friends-nav-btn");
  btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!hasAuthToken()) {
      showSocialToast(t("social.guestPrompt", getLang()));
      return;
    }
    if (!document.getElementById("friends-panel")) {
      sessionStorage.setItem("riffle_open_friends", "1");
      window.location.href = "./index.html";
      return;
    }
    openFriendsPanel();
  });

  btn?.addEventListener("mouseenter", () => {
    if (!hasAuthToken()) maybeShowGuestSocialHint();
  });
}

export function initFriendsPanel() {
  if (window.__riffleFriendsUiInit) return;
  window.__riffleFriendsUiInit = true;

  document.getElementById("close-friends-panel")?.addEventListener("click", closeFriendsPanel);
  document.getElementById("friends-panel")?.addEventListener("click", (e) => {
    if (e.target?.id === "friends-panel") closeFriendsPanel();
  });

  document.querySelectorAll("[data-friends-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-friends-tab");
      if (!name) return;
      setTab(name);
      if (name === "friends") void loadFriendsLists();
      if (name === "requests") void loadRequests();
    });
  });

  document.getElementById("friends-search-input")?.addEventListener("input", () => runSearch());

  window.addEventListener("riffle-lang-changed", () => {
    const panel = document.getElementById("friends-panel");
    if (!panel || panel.classList.contains("hidden")) return;
    void loadFriendsLists();
    void loadRequests();
    const input = document.getElementById("friends-search-input");
    if (input?.value.trim().length >= 2) runSearch();
  });
}
