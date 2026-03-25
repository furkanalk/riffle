import { getUser } from "../core/user-manager.js";
import { gameMode, selectedCategories } from "../categories/state.js";

const CLIENT_ID_KEY = "riffle_client_id";
const ROOM_STORAGE_PREFIX = "riffle_room_";
const ROOM_PLAYERS_STORAGE_KEY = "riffleRoomPlayers";

const COLOR_POOL = ["purple-500", "blue-500", "green-500", "yellow-500", "fuchsia-500", "cyan-500"];

function generateRoomId() {
  // Short-ish human code. Not cryptographically secure; local-only room simulation.
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getOrCreateClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("room");
}

function setRoomIdInUrl(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", url.toString());
}

function loadRoom(roomId) {
  const raw = localStorage.getItem(`${ROOM_STORAGE_PREFIX}${roomId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRoom(roomId, room) {
  localStorage.setItem(`${ROOM_STORAGE_PREFIX}${roomId}`, JSON.stringify(room));
}

function computeRequiredPlayers() {
  if (gameMode === "versus") return 2;

  if (gameMode === "coop") {
    const el = document.getElementById("coop-team-size");
    const v = el ? parseInt(el.value, 10) : 5;
    return Number.isFinite(v) ? Math.max(1, Math.min(5, v)) : 5;
  }

  if (gameMode === "team") {
    const el = document.getElementById("team-players-per-side");
    const perSide = el ? parseInt(el.value, 10) : 5;
    const v = Number.isFinite(perSide) ? Math.max(1, Math.min(5, perSide)) : 5;
    return v * 2;
  }

  return 1;
}

function getEffectiveUsername(u) {
  return u?.username ? String(u.username).slice(0, 40) : "Guest";
}

function getRoomPlayersRoster(room) {
  const players = Array.isArray(room?.players) ? room.players : [];
  const roster = players.slice(0, COLOR_POOL.length).map((p, i) => ({
    name: p.username || `Player ${i + 1}`,
    avatar: p.avatar || "avatar1",
    color: p.color || COLOR_POOL[i] || "purple-500",
    score: 0,
  }));
  return roster;
}

function renderPlayersList(room, myClientId) {
  const list = document.getElementById("players-list");
  if (!list) return;

  const players = Array.isArray(room?.players) ? room.players : [];
  const required = room?.requiredCount ?? computeRequiredPlayers();

  list.innerHTML = "";

  if (players.length === 0) {
    const li = document.createElement("li");
    li.className = "player-row";
    li.innerHTML = `
      <span class="online-dot online-dot--yellow"></span>
      <span class="text-gray-400">Waiting for players…</span>
      <span class="status-pill status-pill--yellow ml-auto">Connecting</span>
    `;
    list.appendChild(li);
    return;
  }

  players.forEach((p) => {
    const isHost = p.clientId === room.hostClientId;
    const isMe = p.clientId === myClientId;
    const dotClass = p.ready ? "online-dot--green" : "online-dot--yellow";
    const statusClass = p.ready ? "status-pill--green" : "status-pill--yellow";
    const statusLabel = p.ready ? "Ready" : "Waiting";

    const displayName = isMe ? "You" : getEffectiveUsername(p);
    const suffix = isHost ? " (Host)" : "";

    const li = document.createElement("li");
    li.className = "player-row";
    li.dataset.clientId = p.clientId;
    li.innerHTML = `
      <span class="online-dot ${dotClass}"></span>
      <span class="${isMe ? "text-white font-medium" : "text-gray-300"}">${displayName}${suffix}</span>
      <span class="status-pill ${statusClass} ml-auto">${statusLabel}</span>
    `;
    list.appendChild(li);
  });

  // If lobby not full, show a subtle placeholder count.
  if (players.length < required) {
    const li = document.createElement("li");
    li.className = "player-row";
    li.style.opacity = "0.85";
    li.innerHTML = `
      <span class="online-dot online-dot--yellow"></span>
      <span class="text-gray-400">Waiting for ${required - players.length} more…</span>
      <span class="status-pill status-pill--yellow ml-auto">Connecting</span>
    `;
    list.appendChild(li);
  }
}

function syncStartButtonState() {
  const btn = document.getElementById("start-game");
  const desktopBtn = document.getElementById("start-game-desktop");
  const hint = document.getElementById("start-hint");
  const hintDesktop = document.getElementById("start-hint-desktop");

  if (!btn) return;

  const roomId = getRoomIdFromUrl();
  if (!roomId) return;

  const room = loadRoom(roomId);
  const required = room?.requiredCount ?? computeRequiredPlayers();
  const participantCount = Array.isArray(room?.players) ? room.players.length : 0;

  const categoriesOk = selectedCategories.length > 0;
  const lobbyOk = participantCount >= required;

  const shouldDisable = !categoriesOk || !lobbyOk;
  btn.disabled = shouldDisable;
  if (desktopBtn) desktopBtn.disabled = shouldDisable;

  if (hint) {
    hint.textContent = !categoriesOk
      ? "Select at least one category"
      : !lobbyOk
        ? `Waiting for ${required - participantCount} players…`
        : "Ready!";
  }
  if (hintDesktop) {
    hintDesktop.textContent = !categoriesOk
      ? "Select at least one category"
      : !lobbyOk
        ? `Waiting for ${required - participantCount} players…`
        : "Start!";
  }
}

let syncTimer = null;

export function initRoomSim() {
  // Only in multiplayer lobby panels.
  if (!["versus", "team", "coop"].includes(gameMode)) return;
  const playersList = document.getElementById("players-list");
  if (!playersList) return;

  const myClientId = getOrCreateClientId();
  const user = getUser();
  const username = getEffectiveUsername(user);
  const avatar = user.avatar || "avatar1";

  let roomId = getRoomIdFromUrl();
  if (!roomId) {
    roomId = generateRoomId();
    setRoomIdInUrl(roomId);
  }

  // Host joins first (if no room exists).
  let room = loadRoom(roomId);
  if (!room) {
    room = {
      roomId,
      hostClientId: myClientId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      requiredCount: computeRequiredPlayers(),
      players: [],
      started: false,
    };
  }

  room.requiredCount = computeRequiredPlayers();
  if (!Array.isArray(room.players)) room.players = [];

  const existing = room.players.find((p) => p.clientId === myClientId);
  if (!existing) {
    const color = room.players.length < COLOR_POOL.length ? COLOR_POOL[room.players.length] : "purple-500";
    room.players.push({
      clientId: myClientId,
      username,
      avatar,
      ready: true,
      joinedAt: Date.now(),
      color,
    });
  } else {
    // Update display info in case user changed avatar.
    existing.username = username;
    existing.avatar = avatar;
    existing.ready = true;
    existing.color = existing.color || COLOR_POOL[room.players.length % COLOR_POOL.length];
  }

  room.updatedAt = Date.now();
  saveRoom(roomId, room);

  // Update invite link UI (if it exists).
  const invite = document.getElementById("invite-link");
  if (invite) {
    const baseUrl = new URL(window.location.href);
    baseUrl.searchParams.set("room", roomId);
    baseUrl.searchParams.set("mode", gameMode);
    invite.value = baseUrl.toString();
  }

  renderPlayersList(room, myClientId);
  syncStartButtonState();

  // If host started, redirect all lobby tabs.
  const maybeRedirectToGame = (nextRoom) => {
    if (!nextRoom?.started) return;
    const started = Boolean(nextRoom.started);
    if (!started) return;
    const url = new URL(window.location.href);
    // If we are already on game page, don't redirect again.
    if (url.pathname.includes("game.html")) return;
    const gameUrl = new URL("./game.html", window.location.href);
    gameUrl.searchParams.set("mode", gameMode);
    gameUrl.searchParams.set("room", roomId);
    window.location.href = gameUrl.toString();
  };

  // Broadcast via the storage event + a small polling loop for self-tab.
  window.addEventListener("storage", (e) => {
    if (e.key === `${ROOM_STORAGE_PREFIX}${roomId}`) {
      const nextRoom = loadRoom(roomId);
      renderPlayersList(nextRoom, myClientId);
      syncStartButtonState();
      maybeRedirectToGame(nextRoom);
    }
  });

  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    const nextRoom = loadRoom(roomId);
    renderPlayersList(nextRoom, myClientId);
    syncStartButtonState();
    maybeRedirectToGame(nextRoom);
  }, 700);
}

export function getRoomIdForGame() {
  return getRoomIdFromUrl();
}

export function getLobbyRoomPlayersForGame() {
  const roomId = getRoomIdFromUrl();
  if (!roomId) return [];
  const room = loadRoom(roomId);
  if (!room) return [];
  return getRoomPlayersRoster(room);
}

export function persistRoomPlayersForGame() {
  const roster = getLobbyRoomPlayersForGame();
  if (!roster || roster.length === 0) return false;
  localStorage.setItem(ROOM_PLAYERS_STORAGE_KEY, JSON.stringify(roster));
  return true;
}

export function markRoomStartedForGame() {
  const roomId = getRoomIdFromUrl();
  if (!roomId) return false;

  let room = loadRoom(roomId);
  if (!room) {
    room = {
      roomId,
      hostClientId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      requiredCount: computeRequiredPlayers(),
      players: [],
      started: true,
      startedAt: Date.now(),
    };
  } else {
    room.started = true;
    room.startedAt = Date.now();
    room.updatedAt = Date.now();
  }

  saveRoom(roomId, room);
  return true;
}

