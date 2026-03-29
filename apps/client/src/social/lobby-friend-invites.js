import { gameMode } from "../categories/state.js";
import { avatarImgSrcFromRoot, DEFAULT_AVATAR_ID, normalizeAvatarId } from "../core/avatars.js";
import { hasAuthToken, listFriends, sendRoomInvite } from "./social-api.js";
import { showSocialToast } from "./social-toast.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/** Relative join path required by API (must include categories.html + room=). */
export function getLobbyJoinPathForApi() {
  const inv = document.getElementById("invite-link")?.value?.trim();
  if (inv) {
    try {
      const u = new URL(inv, window.location.origin);
      const parts = u.pathname.split("/").filter(Boolean);
      const base = parts[parts.length - 1] || "categories.html";
      return `${base}${u.search}`;
    } catch {
      /* fallthrough */
    }
  }
  const u = new URL(window.location.href);
  const parts = u.pathname.split("/").filter(Boolean);
  const base = parts[parts.length - 1] || "categories.html";
  return `${base}${u.search}`;
}

async function renderOnlineFriendsInvite() {
  const box = document.getElementById("lobby-friends-invite");
  const listEl = document.getElementById("lobby-friends-invite-list");
  if (!box || !listEl) return;

  if (!hasAuthToken() || !["versus", "team", "coop"].includes(gameMode)) {
    box.classList.add("hidden");
    return;
  }

  box.classList.remove("hidden");
  listEl.innerHTML = '<p class="friends-empty">Loading friends…</p>';

  try {
    const friends = await listFriends();
    const online = friends.filter((f) => f.online);
    if (online.length === 0) {
      listEl.innerHTML =
        '<p class="friends-empty">No online friends. Share your invite link or ask them to log in.</p>';
      return;
    }
    listEl.innerHTML = "";
    for (const f of online) {
      const row = document.createElement("div");
      row.className = "lobby-invite-row";
      const av = normalizeAvatarId(f.avatar || DEFAULT_AVATAR_ID);
      row.innerHTML = `
        <img class="friends-row__avatar" src="${avatarImgSrcFromRoot(av)}" alt="" width="28" height="28" />
        <span class="friends-row__name">${escapeHtml(f.username)}</span>
        <button type="button" class="btn btn--primary friends-mini-btn" data-invite-user="${f.id}" data-name="${escapeHtml(f.username)}">Invite</button>
      `;
      listEl.appendChild(row);
    }
    listEl.querySelectorAll("[data-invite-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-invite-user"));
        const name = btn.getAttribute("data-name") || "Friend";
        const joinPath = getLobbyJoinPathForApi();
        try {
          await sendRoomInvite(id, joinPath);
          showSocialToast(`Invite sent to ${name}`);
        } catch (e) {
          showSocialToast(e instanceof Error ? e.message : "Could not invite");
        }
      });
    });
  } catch (e) {
    listEl.innerHTML = `<p class="friends-empty">${escapeHtml(e instanceof Error ? e.message : "Could not load friends")}</p>`;
  }
}

export function initLobbyFriendInvites() {
  if (!["versus", "team", "coop"].includes(gameMode)) return;

  void renderOnlineFriendsInvite();

  const chatPanel = document.getElementById("chat-panel");
  if (chatPanel) {
    const mo = new MutationObserver(() => {
      if (!chatPanel.classList.contains("hidden")) void renderOnlineFriendsInvite();
    });
    mo.observe(chatPanel, { attributes: true, attributeFilter: ["class"] });
  }

  window.setInterval(() => {
    const p = document.getElementById("chat-panel");
    if (p && !p.classList.contains("hidden")) void renderOnlineFriendsInvite();
  }, 12000);

  window.addEventListener("riffle-auth-changed", () => void renderOnlineFriendsInvite());
}
