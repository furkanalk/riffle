import { gameMode, selectedCategories } from "../categories/state.js";
import { getUser } from "../core/user-manager.js";

const CLIENT_ID_KEY = "riffle_client_id";
const ROOM_STORAGE_PREFIX = "riffle_room_";
const ROOM_PLAYERS_STORAGE_KEY = "riffleRoomPlayers";
const MAX_CHAT_MESSAGES = 60;
const previousRoomPlayers = new Map();

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

function getSafeAvatarId(avatarId) {
  const id = String(avatarId || "").trim();
  return /^avatar\d+$/.test(id) ? id : "avatar1";
}

function getRoomPlayersRoster(room) {
  const players = Array.isArray(room?.players) ? room.players : [];
  const roster = players.slice(0, COLOR_POOL.length).map((p, i) => ({
    name: p.username || `Player ${i + 1}`,
    avatar: getSafeAvatarId(p.avatar),
    color: p.color || COLOR_POOL[i] || "purple-500",
    score: 0,
  }));
  return roster;
}

function renderPlayersList(room, myClientId) {
  const list = document.getElementById("players-list");
  if (!list) return;
  list.classList.remove("hidden");

  const players = Array.isArray(room?.players) ? room.players : [];
  const teamPerSideEl = document.getElementById("team-players-per-side");
  const perSide = Math.max(1, Math.min(5, parseInt(teamPerSideEl?.value || "5", 10) || 5));
  const required = gameMode === "team" ? perSide * 2 : room?.requiredCount ?? Math.max(2, computeRequiredPlayers());

  list.innerHTML = "";
  list.className = gameMode === "team" ? "players-strip players-strip--two-rows" : "players-strip";
  if (gameMode === "team") {
    list.style.setProperty("--slots-per-row", String(perSide));
  } else {
    list.style.removeProperty("--slots-per-row");
  }

  const renderPlayerChip = (p, isPlaceholder = false) => {
    const li = document.createElement("li");
    li.className = `player-chip${isPlaceholder ? " player-chip--placeholder" : ""}`;
    if (isPlaceholder) {
      li.innerHTML = `
        <span class="player-chip__avatar-wrap">
          <span class="player-chip__avatar player-chip__avatar--empty">+</span>
        </span>
        <span class="player-chip__name">Waiting...</span>
      `;
      return li;
    }
    const isHost = p.clientId === room.hostClientId;
    const isMe = p.clientId === myClientId;
    const avatarId = getSafeAvatarId(p.avatar);
    li.innerHTML = `
      <span class="player-chip__avatar-wrap">
        <img class="player-chip__avatar" src="./src/img/avatars/${avatarId}.png" alt="" onerror="this.onerror=null;this.src='./src/img/avatars/avatar1.png';">
      </span>
      <span class="player-chip__name">${isMe ? "You" : getEffectiveUsername(p)}${isHost ? " • Host" : ""}</span>
    `;
    return li;
  };

  players.forEach((p) => list.appendChild(renderPlayerChip(p)));
  const missing = Math.max(0, required - players.length);
  for (let i = 0; i < missing; i++) list.appendChild(renderPlayerChip(null, true));
}

function renderRoomChat(room, myClientId) {
  const messagesContainer = document.getElementById("chat-messages");
  if (!messagesContainer) return;
  messagesContainer.innerHTML = "";
  const msgs = Array.isArray(room?.chat) ? room.chat.slice(-MAX_CHAT_MESSAGES) : [];

  if (msgs.length === 0) {
    const sys = document.createElement("div");
    sys.className = "chat-system-msg";
    sys.innerHTML =
      '<span class="text-purple-400 font-semibold text-sm">System</span><span class="text-white ml-2">Lobby is live. Invite players and chat here.</span>';
    messagesContainer.appendChild(sys);
    return;
  }

  msgs.forEach((m) => {
    if (m.system) {
      const sys = document.createElement("div");
      sys.className = "chat-system-msg";
      sys.innerHTML = `<span class="text-purple-400 font-semibold text-sm">System</span><span class="text-white ml-2">${String(
        m.text || ""
      )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</span>`;
      messagesContainer.appendChild(sys);
      return;
    }

    const who = m.clientId === myClientId ? "You" : getEffectiveUsername({ username: m.username });
    const avatarId = getSafeAvatarId(m.avatar);
    const safeText = String(m.text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const time = new Date(Number(m.at) || Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const row = document.createElement("div");
    row.className = `chat-message-row${m.clientId === myClientId ? " chat-message-row--me" : ""}`;
    row.innerHTML = `
      <span class="chat-message-avatar-wrap">
        <img class="chat-message-avatar" src="./src/img/avatars/${avatarId}.png" alt="">
      </span>
      <div class="chat-message-body">
        <div class="chat-message-meta">
          <span class="chat-message-name">${who}</span>
          <span class="chat-message-time">${time}</span>
        </div>
        <div class="chat-message-text">${safeText}</div>
      </div>
    `;
    messagesContainer.appendChild(row);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function syncPresenceMessages(room, myClientId) {
  if (!room?.roomId || !Array.isArray(room.players)) return;

  const key = room.roomId;
  const prevIds = previousRoomPlayers.get(key) || [];
  const nextIds = room.players.map((p) => p.clientId);
  previousRoomPlayers.set(key, nextIds);
  if (prevIds.length === 0) return;

  const joinedPlayers = room.players.filter((p) => !prevIds.includes(p.clientId));
  const leftIds = prevIds.filter((id) => !nextIds.includes(id));
  if (joinedPlayers.length === 0 && leftIds.length === 0) return;

  if (!Array.isArray(room.chat)) room.chat = [];
  joinedPlayers.forEach((p) => {
    const name = p.clientId === myClientId ? "You" : getEffectiveUsername(p);
    room.chat.push({ system: true, text: `${name} joined the lobby.`, at: Date.now() });
  });
  leftIds.forEach(() => {
    room.chat.push({ system: true, text: "A player left the lobby.", at: Date.now() });
  });
  room.chat = room.chat.slice(-MAX_CHAT_MESSAGES);
  room.updatedAt = Date.now();
  saveRoom(room.roomId, room);
}

function ensureTeamAssignments(room) {
  if (!Array.isArray(room?.players)) return;
  room.players.forEach((p) => {
    if (p.team !== "A" && p.team !== "B") p.team = null;
  });
}

function renderTeamSetup(room, myClientId) {
  const wrap = document.getElementById("team-setup");
  if (!wrap) return;
  wrap.classList.add("hidden");
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

/** Active WebSocket to the Go matchmaker (when `?ws=1` or localStorage flag). */
let matchmakerWs = null;

function shouldUseMatchmakerWs() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("ws") === "1") return true;
    if (localStorage.getItem("riffle_use_ws_matchmaker") === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function matchmakerWsEndpoint() {
  try {
    const manual = localStorage.getItem("riffle_matchmaker_ws");
    if (manual) {
      return manual.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.__RIFFLE_MATCHMAKER_WS__) {
    return String(window.__RIFFLE_MATCHMAKER_WS__).replace(/\/$/, "");
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.hostname}:8080/ws`;
}

function mapServerRoomToLocal(msg) {
  const existing = loadRoom(msg.roomId);
  return {
    roomId: msg.roomId,
    hostClientId: msg.hostClientId,
    requiredCount: msg.requiredCount,
    players: Array.isArray(msg.players) ? msg.players : [],
    chat: Array.isArray(existing?.chat) ? existing.chat : [],
    started: Boolean(msg.started),
    updatedAt: Date.now(),
    createdAt: Date.now(),
  };
}

/**
 * Notify the Go matchmaker that the host is starting (no-op for localStorage lobby).
 */
export function sendMatchmakerStartGame() {
  if (!matchmakerWs || matchmakerWs.readyState !== WebSocket.OPEN) return;
  matchmakerWs.send(JSON.stringify({ type: "start_game" }));
}

export function isMatchmakerWsLobby() {
  return Boolean(matchmakerWs);
}

function buildMatchSignature() {
  const cats = [...selectedCategories].sort().join(",") || "any";
  const mode = String(gameMode || "solo");
  const timeLimit = document.getElementById("time-limit")?.value || "15";
  return `${mode}|${cats}|${timeLimit}`;
}

function setupRoomCodeControls(roomId, opts = {}) {
  const input = document.getElementById("room-code-input");
  const toggleCodeBtn = document.getElementById("toggle-room-code-visibility");
  const shareBtn = document.getElementById("share-invite");
  const createGameBtn = document.getElementById("game-create-btn");
  const searchGameBtn = document.getElementById("game-search-btn");
  const searchOverlay = document.getElementById("match-search-overlay");
  const cancelSearchBtn = document.getElementById("cancel-match-search");
  if (!input) return;

  const code = String(roomId || "").toUpperCase().slice(0, 6);
  input.value = code ? `#${code}` : "";

  const go = (nextRoomId, extra = {}) => {
    const url = new URL(window.location.href);
    if (nextRoomId) url.searchParams.set("room", nextRoomId);
    else url.searchParams.delete("room");
    url.searchParams.set("mode", gameMode);
    if (opts.preserveWs || extra.ws) url.searchParams.set("ws", "1");
    if (extra.search) url.searchParams.set("search", "1");
    else url.searchParams.delete("search");
    if (extra.sig) url.searchParams.set("sig", extra.sig);
    else url.searchParams.delete("sig");
    window.location.href = url.toString();
  };

  const shareInvite = async () => {
    const link = document.getElementById("invite-link")?.value;
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Riffle room", text: "Join my room!", url: link });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      alert("Invite link copied!");
    } catch {
      alert("Could not share invite link.");
    }
  };

  shareBtn?.addEventListener("click", shareInvite);

  createGameBtn?.addEventListener("click", () => {
    go(null, { ws: true });
  });

  searchGameBtn?.addEventListener("click", () => {
    const sig = buildMatchSignature();
    if (searchOverlay) searchOverlay.classList.remove("hidden");
    setTimeout(() => {
      go(null, { ws: true, search: true, sig });
    }, 350);
  });

  const closeSearchOverlay = () => {
    searchOverlay?.classList.add("hidden");
  };
  cancelSearchBtn?.addEventListener("click", closeSearchOverlay);
  searchOverlay?.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.closeMatchSearch === "1") closeSearchOverlay();
  });

  toggleCodeBtn?.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    toggleCodeBtn.title = hidden ? "Hide room code" : "Show room code";
  });
}

function setupRoomChat(roomId, myClientId, username) {
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-message");
  if (!input || !sendBtn) return;

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    const currentRoomId = roomId || getRoomIdFromUrl();
    if (!currentRoomId) return;

    // In websocket search flow, users may type before the first room_state arrives.
    // Create a minimal local room so chat remains usable immediately.
    const room = loadRoom(currentRoomId) || {
      roomId: currentRoomId,
      hostClientId: null,
      requiredCount: computeRequiredPlayers(),
      players: [],
      chat: [],
      started: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (!Array.isArray(room.chat)) room.chat = [];
    room.chat.push({
      clientId: myClientId,
      username,
      avatar: getUser()?.avatar || "avatar1",
      text: text.slice(0, 240),
      at: Date.now(),
    });
    room.chat = room.chat.slice(-MAX_CHAT_MESSAGES);
    room.updatedAt = Date.now();
    saveRoom(currentRoomId, room);
    renderRoomChat(room, myClientId);
    input.value = "";
  };

  window.riffleLobbySendChat = send;
  sendBtn.onclick = send;
  input.onkeypress = (e) => {
    if (e.key === "Enter") send();
  };
}

function initMatchmakerWsLobby() {
  const myClientId = getOrCreateClientId();
  const user = getUser();
  const username = getEffectiveUsername(user);
  const avatar = user.avatar || "avatar1";

  let roomId = getRoomIdFromUrl();
  const paramsFromUrl = new URLSearchParams(window.location.search);
  const isSearch = paramsFromUrl.get("search") === "1";
  const sig = paramsFromUrl.get("sig") || "";
  if (!roomId) {
    if (!isSearch) {
      roomId = generateRoomId();
      setRoomIdInUrl(roomId);
    }
  }

  setupRoomCodeControls(roomId, { preserveWs: true });
  if (roomId) setupRoomChat(roomId, myClientId, username);
  renderPlayersList(
    {
      roomId: roomId || "__pending__",
      hostClientId: myClientId,
      requiredCount: computeRequiredPlayers(),
      players: [
        {
          clientId: myClientId,
          username,
          avatar,
          ready: true,
        },
      ],
    },
    myClientId
  );
  renderTeamSetup(
    {
      roomId: roomId || "__pending__",
      requiredCount: computeRequiredPlayers(),
      players: [],
    },
    myClientId
  );
  if (roomId) {
    const cachedRoom = loadRoom(roomId);
    if (cachedRoom) {
      renderPlayersList(cachedRoom, myClientId);
      renderTeamSetup(cachedRoom, myClientId);
      renderRoomChat(cachedRoom, myClientId);
      syncStartButtonState();
    }
  }

  const wsParams = new URLSearchParams({
    name: username,
    avatar,
    clientId: myClientId,
    required: String(computeRequiredPlayers()),
  });
  if (roomId) wsParams.set("room", roomId);
  if (isSearch && sig) {
    wsParams.set("search", "1");
    wsParams.set("sig", sig);
  }
  const token = localStorage.getItem("token");
  if (token) wsParams.set("token", token);

  const wsUrl = `${matchmakerWsEndpoint()}?${wsParams.toString()}`;
  matchmakerWs = new WebSocket(wsUrl);

  matchmakerWs.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.type === "room_state") {
      roomId = msg.roomId || roomId;
      if (roomId) setRoomIdInUrl(roomId);
      if (roomId) setupRoomChat(roomId, myClientId, username);
      const room = mapServerRoomToLocal(msg);
      saveRoom(roomId, room);
      syncPresenceMessages(room, myClientId);
      renderPlayersList(room, myClientId);
      renderTeamSetup(room, myClientId);
      renderRoomChat(loadRoom(roomId), myClientId);
      syncStartButtonState();
      const invite = document.getElementById("invite-link");
      if (invite && roomId) {
        const baseUrl = new URL(window.location.href);
        baseUrl.searchParams.set("room", roomId);
        baseUrl.searchParams.set("mode", gameMode);
        baseUrl.searchParams.set("ws", "1");
        baseUrl.searchParams.delete("search");
        baseUrl.searchParams.delete("sig");
        invite.value = baseUrl.toString();
      }
    }
    if (msg.type === "game_started") {
      const url = new URL(window.location.href);
      if (url.pathname.includes("game.html")) return;
      const gameUrl = new URL("./game.html", window.location.href);
      gameUrl.searchParams.set("mode", gameMode);
      gameUrl.searchParams.set("room", roomId);
      window.location.href = gameUrl.toString();
    }
  };

  matchmakerWs.onerror = () => {
    console.warn("[matchmaker] WebSocket error — is the Go service running on :8080?");
  };

  matchmakerWs.onclose = () => {
    matchmakerWs = null;
  };
}

export function initRoomSim() {
  // Only in multiplayer lobby panels.
  if (!["versus", "team", "coop"].includes(gameMode)) return;
  const playersList = document.getElementById("players-list");
  if (!playersList) return;

  if (shouldUseMatchmakerWs()) {
    initMatchmakerWsLobby();
    return;
  }

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
      chat: [],
      started: false,
    };
  }

  room.requiredCount = computeRequiredPlayers();
  if (!Array.isArray(room.players)) room.players = [];
  if (!Array.isArray(room.chat)) room.chat = [];
  ensureTeamAssignments(room);

  const existing = room.players.find((p) => p.clientId === myClientId);
  if (!existing) {
    const color =
      room.players.length < COLOR_POOL.length ? COLOR_POOL[room.players.length] : "purple-500";
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

  setupRoomCodeControls(roomId);
  setupRoomChat(roomId, myClientId, username);

  renderPlayersList(room, myClientId);
  syncPresenceMessages(room, myClientId);
  renderTeamSetup(room, myClientId);
  renderRoomChat(room, myClientId);
  syncStartButtonState();

  const params = new URLSearchParams(window.location.search);
  if (params.get("search") === "1") {
    document.getElementById("tab-chat")?.click();
    const messages = document.getElementById("chat-messages");
    if (messages) {
      const div = document.createElement("div");
      div.className = "chat-system-msg";
      div.innerHTML =
        '<span class="text-purple-400 font-semibold text-sm">Matchmaker</span><span class="text-white ml-2">Matchmaking active. Waiting for compatible players...</span>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
  }

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
      syncPresenceMessages(nextRoom, myClientId);
      renderPlayersList(nextRoom, myClientId);
      renderTeamSetup(nextRoom, myClientId);
      renderRoomChat(nextRoom, myClientId);
      syncStartButtonState();
      maybeRedirectToGame(nextRoom);
    }
  });

  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    const nextRoom = loadRoom(roomId);
    syncPresenceMessages(nextRoom, myClientId);
    renderPlayersList(nextRoom, myClientId);
    renderTeamSetup(nextRoom, myClientId);
    renderRoomChat(nextRoom, myClientId);
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
