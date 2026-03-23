// ui-manager.js

// Local SVG fallback — no external request, no DNS failure
const COVER_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<rect width="200" height="200" rx="12" fill="#180D30"/>' +
    '<path d="M78 58 L78 128 Q78 142 94 145 Q110 148 110 134 Q110 120 94 123 L94 82 L138 70 L138 120 Q138 134 154 137 Q170 140 170 126 Q170 112 154 115 L154 48 Z" fill="#7C3AED" opacity="0.75"/>' +
    "</svg>",
  );

export class UIManager {
  constructor() {
    this.answerButtons = document.querySelectorAll(".answer-btn");
    this.loadingScreen = document.getElementById("loading-screen");
    this.roundCompletion = document.getElementById("round-completion");
    this.resultsModal = document.getElementById("results-modal");
  }

  // Show loading screen with progress simulation
  async simulateLoading() {
    return new Promise((resolve) => {
      const loadingProgress = document.getElementById("loading-progress");
      const loadingText = document.getElementById("loading-text");

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;

        loadingProgress.style.width = `${progress}%`;

        if (progress < 30) {
          loadingText.textContent = "Loading music tracks...";
        } else if (progress < 60) {
          loadingText.textContent = "Preparing categories...";
        } else if (progress < 90) {
          loadingText.textContent = "Almost ready...";
        } else {
          loadingText.textContent = "Starting!";
        }

        if (progress === 100) {
          clearInterval(interval);
          setTimeout(() => {
            this.loadingScreen.classList.add("opacity-0");
            this.loadingScreen.style.transition = "opacity 0.5s ease-out";
            setTimeout(() => {
              this.loadingScreen.classList.add("hidden");
              resolve();
            }, 500);
          }, 500);
        }
      }, 200);
    });
  }

  // Reset UI for new round
  resetUI() {
    this.resetButtons();
    this.resetTimerDisplay();
    this.createMusicVisualizer();
  }

  // Reset answer buttons
  resetButtons() {
    this.answerButtons.forEach((btn) => {
      btn.classList.remove("correct", "wrong", "selected", "timeout-correct");
      btn.disabled = false;
    });
  }

  // Reset timer display
  resetTimerDisplay() {
    const timerBar = document.getElementById("timer-bar");
    if (timerBar) {
      timerBar.style.width = "100%";
      timerBar.style.backgroundColor = "";
      timerBar.textContent = "";
    }
  }

  // Create music visualizer container
  createMusicVisualizer() {
    const container = document.getElementById("music-visualizer");
    if (!container) return;

    let barsContainer = container.querySelector(".audio-bars-container");
    if (!barsContainer) {
      barsContainer = document.createElement("div");
      barsContainer.className = "audio-bars-container flex items-center justify-center space-x-1";
      container.appendChild(barsContainer);
    }
  }

  // Update round information display
  updateRoundInfo(currentRound, totalRounds, isUnlimited = false) {
    const roundInfo = document.getElementById("round-info");
    if (roundInfo) {
      if (isUnlimited) {
        roundInfo.textContent = `Question ${currentRound}`;
      } else {
        roundInfo.textContent = `Question ${currentRound}/${totalRounds}`;
      }
    }
  }

  // Update question display
  updateQuestion(questionText, genreInfo) {
    const questionElement = document.getElementById("question-text");
    const genreElement = document.getElementById("genre-info");

    if (questionElement) questionElement.textContent = questionText;
    if (genreElement) genreElement.textContent = genreInfo;
  }

  // Set answer options on buttons
  setAnswerOptions(options) {
    this.answerButtons.forEach((btn, i) => {
      if (options[i]) {
        btn.textContent = options[i];
        btn.dataset.answer = options[i];
      }
    });
  }

  // Mark button as correct
  markButtonCorrect(answer) {
    this.answerButtons.forEach((btn) => {
      if (btn.dataset.answer === answer) {
        btn.classList.add("correct");
      }
    });
  }

  // Mark button as selected and correct/wrong
  markButtonSelected(selectedButton, isCorrect, correctAnswer) {
    selectedButton.classList.add("selected");

    if (isCorrect) {
      selectedButton.classList.add("correct");
    } else {
      selectedButton.classList.add("wrong");
      // Show correct answer
      this.markButtonCorrect(correctAnswer);
    }

    // Disable all buttons
    this.answerButtons.forEach((btn) => {
      btn.disabled = true;
    });
  }

  // Handle timeout UI (show correct answer with special styling)
  handleTimeoutUI(correctAnswer, answerSelected) {
    this.answerButtons.forEach((btn) => {
      btn.disabled = true;
      if (!answerSelected && btn.dataset.answer === correctAnswer) {
        btn.classList.add("timeout-correct");
      }
    });
  }

  // Show round completion screen
  showRoundCompletionScreen(track, scoreData, isGameOver = false, onNextRound) {
    const roundResult = document.getElementById("round-result");
    const roundMessage = document.getElementById("round-message");
    const scoreTable = document.getElementById("round-score-table");
    const nextRoundBtn = document.getElementById("next-round-btn");
    const albumCoverDisplay = document.getElementById("album-cover-display");
    const songInfo = document.getElementById("song-info");

    // Display album cover and song info
    if (track) {
      albumCoverDisplay.src = track.album?.cover_medium || COVER_FALLBACK;
      const displayTitle = track.cleanTitle || this.cleanSongTitle(track.title);
      songInfo.textContent = `${displayTitle} by ${track.artist}`;
    }

    // Set result message based on last answer
    const selectedAnswer = document.querySelector(".answer-btn.selected");
    const lastAnswerCorrect = selectedAnswer?.classList.contains("correct");
    const timeoutOccurred = document.querySelector(".timeout-correct") !== null;

    if (!selectedAnswer && timeoutOccurred) {
      roundResult.textContent = "Time's Up!";
      roundMessage.textContent = "You didn't select an answer in time.";
      roundResult.className = "text-4xl font-bold text-red-400";
    } else if (lastAnswerCorrect) {
      roundResult.textContent = "Correct!";
      if (scoreData.accuracy > 80) {
        roundMessage.textContent = "You're on fire! Keep it up!";
      } else if (scoreData.accuracy > 50) {
        roundMessage.textContent = "Well done! You're doing great!";
      } else {
        roundMessage.textContent = "Correct! Keep improving!";
      }
      roundResult.className = "text-4xl font-bold text-yellow-400";
    } else if (selectedAnswer) {
      roundResult.textContent = "Wrong Answer!";
      roundMessage.textContent = "Better luck on the next one!";
      roundResult.className = "text-4xl font-bold text-red-400";
    }

    // Update score table
    this.updateScoreTable(
      scoreTable,
      scoreData,
      lastAnswerCorrect,
      timeoutOccurred && !selectedAnswer
    );

    // Update button text
    if (isGameOver) {
      nextRoundBtn.textContent = "See Final Results";
      if (scoreData.gameMode === "solo") {
        roundResult.textContent = "Game Over!";
        roundMessage.textContent = "You ran out of lives!";
        roundResult.className = "text-4xl font-bold text-red-400";
      }
    } else {
      nextRoundBtn.textContent = "Next Round";
    }

    // Set button click handler
    nextRoundBtn.onclick = () => {
      this.roundCompletion.classList.add("hidden");
      onNextRound();
    };

    // Show modal
    this.roundCompletion.classList.remove("hidden");
    this.roundCompletion.style.animation = "quickFadeIn 0.3s forwards";
    nextRoundBtn.focus();

    // Add animation style if needed
    this.addQuickFadeInStyle();
  }

  // Update score table in round completion screen
  updateScoreTable(scoreTable, scoreData, lastAnswerCorrect, timedOut) {
    scoreTable.innerHTML = "";

    if (scoreData.gameMode === "solo" || scoreData.gameMode === "marathon") {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="py-2">
          <div class="flex items-center">
            <div class="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-0.5 mr-2">
              <img src="src/img/avatars/${scoreData.avatar || "avatar1"}.png" alt="Your Avatar" class="rounded-full">
            </div>
            You
          </div>
        </td>
        <td class="py-2 text-center">${scoreData.score}</td>
        <td class="py-2 text-right">
          ${
            lastAnswerCorrect
              ? "+1"
              : timedOut
                ? '<span class="bg-yellow-800 text-xs px-2 py-1 rounded-full">Missed</span>'
                : "+0"
          }
        </td>
      `;
      scoreTable.appendChild(row);

      // Add Marathon mode info row
      const infoRow = document.createElement("tr");
      infoRow.innerHTML = `
        <td class="py-2 text-sm text-gray-400">Streak</td>
        <td class="py-2 text-center">
          ${
            lastAnswerCorrect
              ? scoreData.rounds > 1
                ? "Continues!"
                : "Started!"
              : timedOut
                ? "Timed Out!"
                : "Broken!"
          }
        </td>
        <td class="py-2 text-right">
          <span class="inline-flex items-center bg-gray-800 rounded-full px-3 py-1 text-sm">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>
            </svg>
            ${scoreData.remainingLives}
          </span>
        </td>
      `;
      scoreTable.appendChild(infoRow);
    }
  }

  // Show final results screen
  showFinalResults(scoreData, onReplay, onMenu) {
    const finalScore = document.getElementById("final-score");
    const scoreMessage = document.getElementById("score-message");
    const gameStats = document.getElementById("game-stats");
    const scoreTableBody = document.getElementById("score-table-body");

    // Show final score
    finalScore.textContent = `${scoreData.score}/${scoreData.totalRounds}`;

    // Generate score message
    const percentage = scoreData.accuracy;
    if (percentage >= 90) {
      scoreMessage.textContent = "Amazing! You are a true music genius!";
      scoreMessage.className =
        "text-2xl font-bold text-center text-yellow-400 my-4 animate-pulseGrow";
      this.generateStars(25);
    } else if (percentage >= 70) {
      scoreMessage.textContent = "Great! Your music knowledge is impressive!";
      scoreMessage.className =
        "text-2xl font-bold text-center text-green-400 my-4 animate-pulseGrow";
      this.generateStars(15);
    } else if (percentage >= 50) {
      scoreMessage.textContent = "Good! You could use a bit more practice.";
      scoreMessage.className =
        "text-2xl font-bold text-center text-blue-400 my-4 animate-pulseGrow";
      this.generateStars(8);
    } else if (percentage >= 30) {
      scoreMessage.textContent = "Not bad. You should listen to more music!";
      scoreMessage.className =
        "text-2xl font-bold text-center text-purple-400 my-4 animate-pulseGrow";
      this.generateStars(4);
    } else {
      scoreMessage.textContent = "Thanks for playing anyway!";
      scoreMessage.className =
        "text-2xl font-bold text-center text-gray-400 my-4 animate-pulseGrow";
      this.generateStars(2);
    }

    // Update game statistics
    this.updateGameStats(gameStats, scoreData);
    this.updateFinalScoreTable(scoreTableBody, scoreData);

    // Set up button handlers
    document.getElementById("replay-btn").onclick = onReplay;
    document.getElementById("menu-btn").onclick = onMenu;

    // Show results modal
    this.resultsModal.classList.remove("hidden");
    this.createConfetti();

    setTimeout(() => {
      this.resultsModal.classList.add("show-modal");
      const stars = document.querySelectorAll(".star");
      stars.forEach((star) => {
        star.style.animation = `rotateStar ${Math.random() * 5 + 5}s infinite linear`;
      });
    }, 100);
  }

  // Update game statistics display
  updateGameStats(gameStats, scoreData) {
    let statsHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.1s">
          <p class="text-gray-400 text-sm">Rounds Played</p>
          <p class="text-2xl font-bold">${scoreData.rounds}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.2s">
          <p class="text-gray-400 text-sm">Accuracy</p>
          <p class="text-2xl font-bold">${scoreData.accuracy}%</p>
        </div>`;

    if (scoreData.gameMode === "solo" && scoreData.totalLives !== undefined) {
      statsHTML += `
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.3s">
          <p class="text-gray-400 text-sm">Lives Left</p>
          <p class="text-2xl font-bold">${scoreData.totalLives === Infinity ? "∞" : scoreData.remainingLives}</p>
        </div>`;
    } else {
      statsHTML += `
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.3s">
          <p class="text-gray-400 text-sm">Avg Response</p>
          <p class="text-2xl font-bold">${scoreData.averageResponseTime.toFixed(1)}s</p>
        </div>`;
    }

    statsHTML += `
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.4s">
          <p class="text-gray-400 text-sm">Game Mode</p>
          <p class="text-2xl font-bold">${scoreData.gameMode.charAt(0).toUpperCase() + scoreData.gameMode.slice(1)}</p>
        </div>
      </div>
    `;

    gameStats.innerHTML = statsHTML;
  }

  // Update final score table
  updateFinalScoreTable(scoreTableBody, scoreData) {
    scoreTableBody.innerHTML = "";

    if (scoreData.gameMode === "solo" || scoreData.gameMode === "marathon") {
      const row = document.createElement("tr");
      row.className = "font-bold animate-fadeInUp";
      row.innerHTML = `
        <td class="py-3">
          <div class="flex items-center">
            <span class="text-yellow-400 mr-2">👑</span>
            You
          </div>
        </td>
        <td class="py-3 text-center text-purple-400">${scoreData.score}</td>
        <td class="py-3 text-right">
          <span class="inline-block bg-gray-800 rounded-full px-2 py-1 text-sm">
            ${scoreData.accuracy}%
          </span>
        </td>
      `;
      scoreTableBody.appendChild(row);
    } else if (scoreData.players) {
      // Multiplayer mode
      const sortedPlayers = [...scoreData.players].sort((a, b) => b.score - a.score);

      sortedPlayers.forEach((player, i) => {
        const accuracy = Math.round((player.score / scoreData.totalRounds) * 100);

        const row = document.createElement("tr");
        row.className = i === 0 ? "font-bold animate-fadeInUp" : "animate-fadeInUp";
        row.style.animationDelay = `${0.1 + i * 0.1}s`;
        row.innerHTML = `
          <td class="py-3">
            <div class="flex items-center">
              ${
                i === 0
                  ? '<span class="text-yellow-400 mr-2">👑</span>'
                  : i === 1
                    ? '<span class="text-gray-300 mr-2">🥈</span>'
                    : i === 2
                      ? '<span class="text-amber-700 mr-2">🥉</span>'
                      : ""
              }
              <div class="h-7 w-7 rounded-full bg-gradient-to-br from-${player.color} to-indigo-600 p-0.5 mr-2">
                <img src="src/img/avatars/${player.avatar}.png" alt="${player.name}'s Avatar" class="rounded-full">
              </div>
              ${player.name}
            </div>
          </td>
          <td class="py-3 text-center text-${player.color}-400">${player.score}</td>
          <td class="py-3 text-right">
            <span class="inline-block bg-gray-800 rounded-full px-2 py-1 text-sm">
              ${accuracy}%
            </span>
          </td>
        `;
        scoreTableBody.appendChild(row);
      });
    }
  }

  // Generate stars for final screen
  generateStars(count) {
    const starsContainer = document.querySelector(".stars-container");
    if (!starsContainer) return;

    starsContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";

      const size = Math.random() * 20 + 10;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = Math.random() * 3 + 2;

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${posX}%`;
      star.style.top = `${posY}%`;
      star.style.animationDelay = `${delay}s`;
      star.style.animationDuration = `${duration}s`;

      starsContainer.appendChild(star);
    }
  }

  // Create confetti effect
  createConfetti() {
    const flash = document.createElement("div");
    flash.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:rgba(255,255,255,0.3);z-index:999;pointer-events:none";
    document.body.appendChild(flash);

    flash.animate([{ opacity: 0.3 }, { opacity: 0 }], {
      duration: 400,
      easing: "ease-out",
    }).onfinish = () => flash.remove();

    const confettiContainer = document.createElement("div");
    confettiContainer.className = "confetti-container";
    confettiContainer.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:1000;pointer-events:none";
    document.body.appendChild(confettiContainer);

    setTimeout(() => confettiContainer.remove(), 3000);

    const colors = ["#FF1493", "#00BFFF", "#FFD700", "#32CD32", "#FF4500", "#9400D3"];
    const shapes = ["circle", "square", "triangle", "star"];

    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement("div");
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;

      confetti.style.cssText = `position:absolute;left:${Math.random() * 100}vw;top:${Math.random() * 30 - 20}vh;z-index:1001;pointer-events:none`;

      switch (shape) {
        case "circle":
          confetti.style.cssText += `width:${size}px;height:${size}px;background-color:${color};border-radius:50%`;
          break;
        case "square":
          confetti.style.cssText += `width:${size}px;height:${size}px;background-color:${color}`;
          break;
        case "triangle":
          confetti.style.cssText += `width:0;height:0;border-left:${size}px solid transparent;border-right:${size}px solid transparent;border-bottom:${size * 1.5}px solid ${color}`;
          break;
        case "star":
          confetti.style.cssText += `width:${size * 1.5}px;height:${size * 1.5}px;background-color:${color};clip-path:polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`;
          break;
      }

      const duration = Math.random() * 2 + 1;
      const delay = Math.random() * 0.5;

      confetti.style.animation = `confettiFall ${duration}s ${delay}s ease-in forwards`;
      confettiContainer.appendChild(confetti);
    }

    this.addConfettiStyle();
  }

  // Add confetti animation style
  addConfettiStyle() {
    if (!document.getElementById("confetti-style")) {
      const style = document.createElement("style");
      style.id = "confetti-style";
      style.textContent = `
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          25% { opacity: 1; }
          100% { transform: translateY(500px) translateX(200px) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Add quick fade-in animation style
  addQuickFadeInStyle() {
    if (!document.getElementById("quick-fade-in-style")) {
      const style = document.createElement("style");
      style.id = "quick-fade-in-style";
      style.textContent = `
        @keyframes quickFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Clean song title (remove remastered tags)
  cleanSongTitle(title) {
    if (!title) return title;
    return title
      .replace(/\s*[([](?:Remastered|Re-?master|Re-?issue).*?[)\]]/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // Setup UI based on game mode
  setupGameMode(gameMode, settings, players) {
    const fullModeLabel =
      {
        solo: "Marathon Mode",
        coop: "Cooperative Mode",
        versus: "Solo VS Mode",
        team: "Team VS Mode",
        chaos: "Chaos Mode",
        custom: "Custom Mode",
      }[gameMode] || "Riffle";

    const compactModeLabel =
      {
        solo: "Marathon",
        coop: "Co-op",
        versus: "VS",
        team: "Team VS",
        chaos: "Chaos",
        custom: "Custom",
      }[gameMode] || "Riffle";

    const modeTitleEl = document.getElementById("game-mode-title");
    if (modeTitleEl) {
      const useCompact = window.matchMedia("(max-width: 640px)").matches;
      modeTitleEl.textContent = useCompact ? compactModeLabel : fullModeLabel;
    }

    if (gameMode === "solo") {
      document.getElementById("timer-container").classList.add("hidden");
      document.getElementById("players-container").classList.add("hidden");

      if (settings.rounds === "unlimited") {
        document.getElementById("round-info").classList.add("hidden");
      }
    } else {
      document.getElementById("timer-container").classList.remove("hidden");

      if (["versus", "team", "coop"].includes(gameMode)) {
        document.getElementById("players-container").classList.remove("hidden");
        this.renderPlayersList(players);
      }
    }
  }

  // Render players list for multiplayer modes
  renderPlayersList(players) {
    const playersList = document.getElementById("players-list");
    if (!playersList || !players) return;

    playersList.innerHTML = "";

    players.forEach((player, i) => {
      const playerCard = document.createElement("div");
      playerCard.className = `bg-gray-800 bg-opacity-70 rounded-lg p-3 text-center border-l-4 border-${player.color}`;
      playerCard.innerHTML = `
        <div class="mb-2 flex justify-center">
          <div class="h-10 w-10 rounded-full bg-gradient-to-br from-${player.color} to-indigo-600 p-1">
            <img src="src/img/avatars/${player.avatar}.png" alt="${player.name}'s Avatar" class="rounded-full">
          </div>
        </div>
        <div class="font-bold ${i === 0 ? "text-white" : "text-gray-300"}">${player.name}</div>
        <div class="text-2xl font-bold text-${player.color}">0</div>
      `;
      playersList.appendChild(playerCard);
    });
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
