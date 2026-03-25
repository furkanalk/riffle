// Oyun başlatma ve ayarları kaydetme
import { getEffectiveAvatarId } from "../core/user-manager.js";
import { isQuickPlayMode, QUICK_PLAY_FIXED } from "./quick-play.js";
import { gameMode, selectedCategories } from "./state.js";

// Start the game
function startGame() {
  if (selectedCategories.length === 0) {
    alert("Please select at least one category!");
    return;
  }

  const answerVisibility = (() => {
    if (gameMode === "solo") return "visible";
    if (isQuickPlayMode()) return QUICK_PLAY_FIXED.answerVisibility;
    return document.getElementById("answer-visibility")
      ? document.getElementById("answer-visibility").value
      : "visible";
  })();

  const selectedAvatar = getEffectiveAvatarId();

  const coopTeamSizeEl = document.getElementById("coop-team-size");
  const teamPerSideEl = document.getElementById("team-players-per-side");
  const coopTeamSize = coopTeamSizeEl ? coopTeamSizeEl.value : "5";
  const teamPlayersPerSide = teamPerSideEl ? teamPerSideEl.value : "5";

  // Get lives setting for marathon mode
  const lives =
    gameMode === "solo" ? document.getElementById("lives-count").value : "not-applicable";

  const roundCountSelect = document.getElementById("round-count");
  const timeEl = document.getElementById("time-limit");
  const roundsValue = (() => {
    if (gameMode === "solo") return "unlimited";
    if (isQuickPlayMode()) return QUICK_PLAY_FIXED.rounds;
    return roundCountSelect.value;
  })();
  const timeLimitValue = (() => {
    if (isQuickPlayMode()) return QUICK_PLAY_FIXED.timeLimit;
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
  window.location.href = `game.html?mode=${gameMode}`;
}

export { startGame };
