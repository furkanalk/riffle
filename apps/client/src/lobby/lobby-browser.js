import { getEffectiveAvatarId, getRegisteredUserId, getUser } from "../core/user-manager.js";
import { hasAuthToken, listFriends } from "../social/social-api.js";

const ROOM_STORAGE_PREFIX = "riffle_room_";
const CLIENT_ID_KEY = "riffle_client_id";
const ROOM_ACTIVE_TTL_MS = 2 * 60 * 1000;
const ROOM_PRUNE_AGE_MS = 24 * 60 * 60 * 1000;

let friendsListCache = null;
let friendsListPromise = null;

function getOrCreateClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function roomKey(roomId) {
  return `${ROOM_STORAGE_PREFIX}${roomId}`;
}

function allRooms() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(ROOM_STORAGE_PREFIX)) continue;
    try {
      const room = JSON.parse(localStorage.getItem(key) || "{}");
      if (!room || typeof room !== "object") continue;
      if (!isRoomOpen(room)) continue;
      out.push(room);
    } catch {
      // ignore invalid room payload
    }
  }
  return out.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}

function roomLastSeenAt(room) {
  return Number(room.lastSeenAt || room.updatedAt || room.createdAt || 0);
}

function isRoomOpen(room) {
  if (!room || typeof room !== "object") return false;
  if (room.started) return false;
  if (room.closedAt) return false;
  const players = Array.isArray(room.players) ? room.players.length : 0;
  if (players < 1) return false;
  const lastSeen = roomLastSeenAt(room);
  if (!Number.isFinite(lastSeen) || lastSeen <= 0) return false;
  return Date.now() - lastSeen <= ROOM_ACTIVE_TTL_MS;
}

function pruneRoomStorage() {
  const now = Date.now();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ROOM_STORAGE_PREFIX)) continue;
    try {
      const room = JSON.parse(localStorage.getItem(key) || "{}");
      const lastSeen = roomLastSeenAt(room);
      const tooOld = !Number.isFinite(lastSeen) || now - lastSeen > ROOM_PRUNE_AGE_MS;
      if (tooOld || room?.started || room?.closedAt) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
}

function getCurrentProfile() {
  const user = getUser();
  return {
    username: String(user?.username || "Guest").slice(0, 40),
    avatar: getEffectiveAvatarId(),
    isGuest: user?.type !== "registered",
  };
}

function ensurePlayerInRoom(room, clientId) {
  if (!Array.isArray(room.players)) room.players = [];
  if (room.players.some((p) => p.clientId === clientId)) return;
  const profile = getCurrentProfile();
  room.players.push({
    clientId,
    username: profile.username,
    avatar: profile.avatar,
    team: null,
    joinedAt: Date.now(),
    isHost: room.hostClientId === clientId,
  });
}

function openRoom(room) {
  const mode = String(room.mode || "versus");
  const roomId = String(room.roomId || "");
  const url = new URL("./categories.html", window.location.href);
  url.searchParams.set("mode", mode);
  url.searchParams.set("ws", "1");
  url.searchParams.set("lobby", "1");
  url.searchParams.set("room", roomId);
  if (room.name) url.searchParams.set("lobbyName", String(room.name));
  if (room.isPrivate) {
    url.searchParams.set("lobbyPrivate", "1");
    if (room.password) url.searchParams.set("lobbyPassword", String(room.password));
  }
  if (room.friendsOnly) url.searchParams.set("lobbyFriends", "1");
  window.location.href = url.toString();
}

function openRoomFromServer(room) {
  const pw = sessionStorage.getItem("riffle_lobby_join_password") || "";
  sessionStorage.removeItem("riffle_lobby_join_password");
  const url = new URL("./categories.html", window.location.href);
  url.searchParams.set("mode", String(room.mode || "versus"));
  url.searchParams.set("ws", "1");
  url.searchParams.set("lobby", "1");
  url.searchParams.set("room", String(room.roomId || ""));
  if (room.name) url.searchParams.set("lobbyName", String(room.name));
  if (room.isPrivate) url.searchParams.set("lobbyPrivate", "1");
  if (room.friendsOnly) url.searchParams.set("lobbyFriends", "1");
  if (pw) url.searchParams.set("lobbyPassword", pw);
  window.location.href = url.toString();
}

function normalizeServerLobby(entry) {
  return {
    roomId: entry.roomId,
    name: entry.name || "Lobby",
    mode: entry.mode || "versus",
    requiredCount: entry.requiredCount ?? 2,
    playerCount: entry.playerCount ?? 0,
    hostUsername: entry.hostUsername || "",
    hostUserId: entry.hostUserId,
    isPrivate: Boolean(entry.isPrivate),
    friendsOnly: Boolean(entry.friendsOnly),
    createdAt: entry.createdAt,
    lastSeenAt: entry.lastSeenAt,
    _source: "server",
    players: [],
    password: "",
  };
}

function collectVisibleServerRooms(serverList) {
  const filter = document.getElementById("lobby-filter")?.value || "all";
  const me = getCurrentProfile();
  return serverList.filter((room) => {
    if (filter === "public") return !room.isPrivate && !room.friendsOnly;
    if (filter === "friends") return Boolean(room.friendsOnly);
    if (room.friendsOnly && me.isGuest) return false;
    return true;
  });
}

function updateLobbyNotice(source) {
  const el = document.getElementById("lobby-notice");
  if (!el) return;
  if (source === "server") {
    el.innerHTML =
      "<strong>Live list:</strong> Open lobbies come from the <em>matchmaker</em> (rooms with at least one active connection).";
  } else {
    el.innerHTML =
      "<strong>Offline / fallback:</strong> The matchmaker list is unavailable. Showing <em>this browser only</em> (dev cache).";
  }
}

function getHostPlayer(room) {
  if (room._source === "server") {
    return { username: room.hostUsername || "—" };
  }
  const players = Array.isArray(room.players) ? room.players : [];
  const byFlag = players.find((p) => p.isHost);
  if (byFlag) return byFlag;
  return players.find((p) => p.clientId === room.hostClientId) || players[0];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCreatedAt(ts) {
  const t = Number(ts);
  if (!Number.isFinite(t) || t <= 0) return "—";
  const d = Date.now() - t;
  const sec = Math.floor(d / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function matchesSearch(room, raw) {
  const q = String(raw || "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  const name = String(room.name || "").toLowerCase();
  const code = String(room.roomId || "").toLowerCase();
  return name.includes(q) || code.includes(q);
}

function roomPlayerStats(room) {
  if (room._source === "server") {
    const players = Number(room.playerCount) || 0;
    const required = Number(room.requiredCount || 2);
    return { players, required, full: players >= required };
  }
  const players = Array.isArray(room.players) ? room.players.length : 0;
  const required = Number(room.requiredCount || 2);
  const full = players >= required;
  return { players, required, full };
}

function passesModeFilter(room, modeFilter) {
  if (modeFilter === "all") return true;
  return String(room.mode || "versus") === modeFilter;
}

function passesPlayersFilter(room, playersFilter) {
  const { players, required, full } = roomPlayerStats(room);
  if (playersFilter === "any") return true;
  if (playersFilter === "open") return players < required;
  if (playersFilter === "full") return full;
  return true;
}

function isRoomHostClient(room, clientId) {
  return String(room.hostClientId || "") === String(clientId);
}

function isRegisteredHost(room) {
  const mine = getRegisteredUserId();
  const hid = room.hostUserId;
  if (mine == null || hid == null) return false;
  return Number(mine) === Number(hid);
}

async function prefetchFriendsList() {
  if (!hasAuthToken()) return;
  if (friendsListCache !== null) return;
  if (friendsListPromise) {
    await friendsListPromise;
    return;
  }
  friendsListPromise = listFriends()
    .then((list) => {
      friendsListCache = list;
      return list;
    })
    .catch(() => {
      friendsListCache = [];
      return [];
    })
    .finally(() => {
      friendsListPromise = null;
    });
  await friendsListPromise;
}

async function canJoinFriendsOnlyRoom(room) {
  const clientId = getOrCreateClientId();
  if (isRegisteredHost(room)) return true;
  if (room._source !== "server" && isRoomHostClient(room, clientId)) return true;

  const me = getCurrentProfile();
  if (me.isGuest) {
    alert("Friends-only lobbies require a logged-in account.");
    return false;
  }

  const hid = room.hostUserId;
  if (hid == null || hid === "") {
    alert(
      "This friends-only lobby cannot verify friend access (created before host id was stored). Ask the host to create a new lobby."
    );
    return false;
  }

  await prefetchFriendsList();
  const friends = friendsListCache ?? [];
  const ok = friends.some((f) => Number(f.id) === Number(hid));
  if (!ok) {
    alert("Only the host's friends can join this lobby.");
    return false;
  }
  return true;
}

function renderRoomItem(room) {
  const wrap = document.createElement("div");
  wrap.className = "lobby-item";
  const isPrivate = Boolean(room.isPrivate);
  const isFriendsOnly = Boolean(room.friendsOnly);
  const modeLabel = room.mode === "team" ? "Team VS" : room.mode === "coop" ? "Co-op" : "Solo VS";
  const { players, required } = roomPlayerStats(room);
  const host = getHostPlayer(room);
  const hostName = host?.username ? String(host.username) : "—";
  const created = formatCreatedAt(room.createdAt);
  const titleSafe = escapeHtml(String(room.name || "Untitled Lobby"));
  const hostSafe = escapeHtml(hostName);

  wrap.innerHTML = `
    <div class="lobby-item__top">
      <div class="lobby-item__title">${titleSafe}</div>
      <div class="lobby-pill">${isPrivate ? "🔒 Private" : isFriendsOnly ? "👥 Friends" : "🌐 Public"}</div>
    </div>
    <div class="lobby-item__meta lobby-item__meta--host">${modeLabel} · ${players}/${required} · #${String(room.roomId || "").toUpperCase()}</div>
    <div class="lobby-item__sub">Host: ${hostSafe} · Created: ${created}</div>
    <div class="lobby-item__actions">
      <button type="button" class="btn btn--primary">Join</button>
    </div>
  `;

  wrap.querySelector("button")?.addEventListener("click", async () => {
    if (room._source === "server") {
      if (isFriendsOnly) {
        const allowed = await canJoinFriendsOnlyRoom(room);
        if (!allowed) return;
      }
      if (isPrivate) {
        const entered = window.prompt("This lobby is private. Enter password:");
        if (!entered) return;
        sessionStorage.setItem("riffle_lobby_join_password", entered);
      } else {
        sessionStorage.removeItem("riffle_lobby_join_password");
      }
      openRoomFromServer(room);
      return;
    }
    if (isFriendsOnly) {
      const allowed = await canJoinFriendsOnlyRoom(room);
      if (!allowed) return;
    }
    if (isPrivate) {
      const entered = window.prompt("This lobby is private. Enter password:");
      if (!entered) return;
      if (entered !== String(room.password || "")) {
        alert("Wrong password.");
        return;
      }
    }
    const clientId = getOrCreateClientId();
    const stored = JSON.parse(localStorage.getItem(roomKey(room.roomId)) || "{}");
    ensurePlayerInRoom(stored, clientId);
    stored.updatedAt = Date.now();
    localStorage.setItem(roomKey(room.roomId), JSON.stringify(stored));
    openRoom(stored);
  });

  return wrap;
}

function collectVisibleRooms() {
  const filter = document.getElementById("lobby-filter")?.value || "all";
  const me = getCurrentProfile();
  return allRooms().filter((room) => {
    if (filter === "public") return !room.isPrivate && !room.friendsOnly;
    if (filter === "friends") return Boolean(room.friendsOnly);
    if (room.friendsOnly && me.isGuest) return false;
    return true;
  });
}

function applyLobbyFilters(rooms) {
  const modeFilter = document.getElementById("lobby-mode-filter")?.value || "all";
  const playersFilter = document.getElementById("lobby-players-filter")?.value || "any";
  const q = document.getElementById("lobby-search")?.value || "";
  return rooms.filter(
    (room) =>
      matchesSearch(room, q) &&
      passesModeFilter(room, modeFilter) &&
      passesPlayersFilter(room, playersFilter)
  );
}

async function renderLobbies() {
  const list = document.getElementById("lobby-list");
  if (!list) return;

  let rooms = [];
  let source = "local";
  try {
    const res = await fetch("/api/matchmaker/lobbies");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lobbies)) {
        rooms = data.lobbies.map(normalizeServerLobby);
        source = "server";
      }
    }
  } catch {
    /* fallback below */
  }

  if (source === "local") {
    pruneRoomStorage();
    rooms = applyLobbyFilters(collectVisibleRooms());
  } else {
    rooms = applyLobbyFilters(collectVisibleServerRooms(rooms));
  }

  updateLobbyNotice(source);

  list.innerHTML = "";
  if (rooms.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lobby-item__meta";
    empty.textContent = "No lobbies match your filters. Try adjusting search or filters.";
    list.appendChild(empty);
    return;
  }
  rooms.forEach((room) => {
    list.appendChild(renderRoomItem(room));
  });
}

function randomRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createLobby() {
  const name = document.getElementById("create-room-name")?.value?.trim() || "New Lobby";
  const mode = document.getElementById("create-room-mode")?.value || "versus";
  const isPrivate = Boolean(document.getElementById("create-room-private")?.checked);
  const friendsOnly = Boolean(document.getElementById("create-room-friends-only")?.checked);
  const password = document.getElementById("create-room-password")?.value || "";
  if (isPrivate && password.trim().length < 3) {
    alert("Private room password must be at least 3 chars.");
    return;
  }
  if (friendsOnly && !getRegisteredUserId()) {
    alert("Friends-only rooms require a logged-in account so friends can be verified.");
    return;
  }
  const roomId = randomRoomId();
  const url = new URL("./categories.html", window.location.href);
  url.searchParams.set("mode", mode);
  url.searchParams.set("ws", "1");
  url.searchParams.set("lobby", "1");
  url.searchParams.set("room", roomId);
  url.searchParams.set("lobbyName", name);
  if (isPrivate) {
    url.searchParams.set("lobbyPrivate", "1");
    url.searchParams.set("lobbyPassword", password);
  }
  if (friendsOnly) url.searchParams.set("lobbyFriends", "1");
  window.location.href = url.toString();
}

function clearLocalRoomsFromBrowser() {
  if (
    !window.confirm(
      "Remove every lobby stored in this browser? This does not affect live matchmaker rooms."
    )
  ) {
    return;
  }
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(ROOM_STORAGE_PREFIX)) toRemove.push(key);
  }
  for (const k of toRemove) {
    localStorage.removeItem(k);
  }
  friendsListCache = null;
  renderLobbies();
}

let searchDebounce = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("clear-local-lobbies-btn")
    ?.addEventListener("click", clearLocalRoomsFromBrowser);
  document.getElementById("refresh-lobbies-btn")?.addEventListener("click", () => {
    friendsListCache = null;
    void prefetchFriendsList().finally(() => renderLobbies());
  });
  document.getElementById("lobby-filter")?.addEventListener("change", renderLobbies);
  document.getElementById("lobby-mode-filter")?.addEventListener("change", renderLobbies);
  document.getElementById("lobby-players-filter")?.addEventListener("change", renderLobbies);
  document.getElementById("lobby-search")?.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderLobbies, 200);
  });
  document.getElementById("create-lobby-btn")?.addEventListener("click", createLobby);
  window.addEventListener("storage", () => renderLobbies());
  window.addEventListener("riffle-auth-changed", () => {
    friendsListCache = null;
    void prefetchFriendsList().finally(() => renderLobbies());
  });
  void prefetchFriendsList().finally(() => renderLobbies());
  setInterval(renderLobbies, 20_000);
});
