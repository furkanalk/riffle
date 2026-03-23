// Oyun başlatma ve ayarları kaydetme
import { gameMode, selectedCategories } from "./state.js";

// Start the game
function startGame() {
  if (selectedCategories.length === 0) {
    alert("Please select at least one category!");
    return;
  }

  // Get answer visibility setting (not needed for Marathon mode)
  const answerVisibility =
    gameMode === "solo"
      ? "visible"
      : document.getElementById("answer-visibility")
        ? document.getElementById("answer-visibility").value
        : "visible";

  // Get selected avatar
  const selectedAvatarElement = document.querySelector(".avatar-option.selected");
  const selectedAvatar = selectedAvatarElement
    ? selectedAvatarElement.getAttribute("data-avatar")
    : "avatar1";

  // Get lives setting for marathon mode
  const lives =
    gameMode === "solo" ? document.getElementById("lives-count").value : "not-applicable";

  // Get game settings
  const roundCountSelect = document.getElementById("round-count");
  const gameSettings = {
    mode: gameMode,
    categories: selectedCategories,
    // For Marathon mode (solo), always use the hidden input value to ensure it's unlimited
    rounds: gameMode === "solo" ? "unlimited" : roundCountSelect.value,
    questionType: "mixed",
    timeLimit: parseInt(document.getElementById("time-limit").value, 10),
    answerVisibility: answerVisibility,
    avatar: selectedAvatar,
    lives: lives,
  };

  // Save global game settings for the current session
  localStorage.setItem("riffleGameSettings", JSON.stringify(gameSettings));

  // Save mode-specific settings for future sessions
  localStorage.setItem(
    `riffleSettings_${gameMode}`,
    JSON.stringify({
      categories: selectedCategories,
      // For Marathon mode (solo), always use unlimited rounds in saved settings
      rounds: gameMode === "solo" ? "unlimited" : document.getElementById("round-count").value,
      questionType: "mixed",
      timeLimit: parseInt(document.getElementById("time-limit").value, 10),
      answerVisibility: answerVisibility,
      lives: lives,
    })
  );

  // Save avatar selection separately
  localStorage.setItem("selectedAvatar", selectedAvatar);

  console.log(`Game settings saved for ${gameMode} mode with avatar: ${selectedAvatar}`);

  // Redirect to the game page
  window.location.href = `game.html?mode=${gameMode}`;
}

export { startGame };
