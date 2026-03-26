// Oyun başlatma ve ayarları kaydetme
import { getEffectiveAvatarId } from "../core/user-manager.js";
import {
  getRoomIdForGame,
  markRoomStartedForGame,
  persistRoomPlayersForGame,
  sendMatchmakerStartGame,
} from "../lobby/room-sim.js";
import { getQuickPlayFixed, isQuickPlayMode } from "./quick-play.js";
import { gameMode, selectedCategories } from "./state.js";

function ensureTeamSelectedBeforeStart(roomId) {
  if (gameMode !== "team" || !roomId) return true;
  const raw = localStorage.getItem(`riffle_room_${roomId}`);
  if (!raw) return true;
  let room;
  try {
    room = JSON.parse(raw);
  } catch {
    return true;
  }
  if (!room || !Array.isArray(room.players)) return true;
  const myClientId = localStorage.getItem("riffle_client_id");
  const me = room.players.find((p) => p.clientId === myClientId);
  if (!me) return true;
  if (me.team === "A" || me.team === "B") return true;

  const modal = document.getElementById("team-pick-modal");
  const players = document.getElementById("team-pick-players");
  const closeBtn = document.getElementById("team-pick-close");
  const blueBtn = document.getElementById("team-pick-blue");
  const redBtn = document.getElementById("team-pick-red");
  if (!modal || !players || !blueBtn || !redBtn) return true;

  const renderPlayers = () => {
    const names = room.players.map((p) => (p.clientId === myClientId ? "You" : p.username || "Guest"));
    players.innerHTML = names.map((n) => `<span class="team-pick-player">${n}</span>`).join("");
  };
  renderPlayers();

  const close = () => modal.classList.add("hidden");
  const pick = (team) => {
    me.team = team;
    room.updatedAt = Date.now();
    localStorage.setItem(`riffle_room_${roomId}`, JSON.stringify(room));
    close();
    startGame();
  };

  blueBtn.onclick = () => pick("A");
  redBtn.onclick = () => pick("B");
  closeBtn.onclick = close;
  modal.onclick = (e) => {
    if (e.target && e.target.dataset && e.target.dataset.closeTeamPick === "1") close();
  };
  modal.classList.remove("hidden");
  return false;
}

// Start the game
function startGame() {
  if (selectedCategories.length === 0) {
    alert("Please select at least one category!");
    return;
  }

  const roomId = ["versus", "team", "coop"].includes(gameMode) ? getRoomIdForGame() : null;
  if (!ensureTeamSelectedBeforeStart(roomId)) return;
  const quickRules = getQuickPlayFixed(gameMode);
  if (roomId) {
    const ok = persistRoomPlayersForGame();
    if (!ok) {
      alert("Room is not ready yet. Please wait for other players.");
      return;
    }
    sendMatchmakerStartGame();
    markRoomStartedForGame();
  }

  const answerVisibility = (() => {
    if (gameMode === "solo") return "visible";
    if (isQuickPlayMode()) return quickRules.answerVisibility;
    return document.getElementById("answer-visibility")
      ? document.getElementById("answer-visibility").value
      : "visible";
  })();

  const selectedAvatar = getEffectiveAvatarId();

  const coopTeamSizeEl = document.getElementById("coop-team-size");
  const teamPerSideEl = document.getElementById("team-players-per-side");
  const coopTeamSize = coopTeamSizeEl ? coopTeamSizeEl.value : "5";
  const teamPlayersPerSide = teamPerSideEl ? teamPerSideEl.value : "5";

  // Marathon uses fixed single-life checkpoint system.
  const lives = gameMode === "solo" ? "1" : "not-applicable";

  const roundCountSelect = document.getElementById("round-count");
  const timeEl = document.getElementById("time-limit");
  const roundsValue = (() => {
    if (gameMode === "solo") return "unlimited";
    if (isQuickPlayMode()) return quickRules.rounds;
    return roundCountSelect.value;
  })();
  const timeLimitValue = (() => {
    if (isQuickPlayMode()) return quickRules.timeLimit;
    return parseInt(timeEl.value, 10);
  })();

  const gameSettings = {
    mode: gameMode,
    categories: selectedCategories,
    rounds: roundsValue,
    questionType: "mixed",
    timeLimit: timeLimitValue,
    answerVisibility: answerVisibility,
    avatar: selectedAvatar,
    lives: lives,
    coopTeamSize,
    teamPlayersPerSide,
    roomId,
  };

  // Save global game settings for the current session
  localStorage.setItem("riffleGameSettings", JSON.stringify(gameSettings));

  // Save mode-specific settings for future sessions
  localStorage.setItem(
    `riffleSettings_${gameMode}`,
    JSON.stringify({
      categories: selectedCategories,
      rounds: roundsValue,
      questionType: "mixed",
      timeLimit: timeLimitValue,
      answerVisibility: answerVisibility,
      lives: lives,
      coopTeamSize,
      teamPlayersPerSide,
    })
  );

  // Save avatar selection separately
  localStorage.setItem("selectedAvatar", selectedAvatar);

  console.log(`Game settings saved for ${gameMode} mode with avatar: ${selectedAvatar}`);

  // Redirect to the game page
  window.location.href = roomId
    ? `game.html?mode=${gameMode}&room=${roomId}`
    : `game.html?mode=${gameMode}`;
}

export { startGame };
