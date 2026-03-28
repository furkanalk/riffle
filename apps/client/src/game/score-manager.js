// score-manager.js
import { AVATAR_IDS, DEFAULT_AVATAR_ID } from "../core/avatars.js";
import { getEffectiveAvatarId } from "../core/user-manager.js";

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.players = [];
    this.responseTimeHistory = [];
    this.currentRound = 0;
    this.lives = 3;
    this.remainingLives = 3;
  }

  setPlayers(roster) {
    if (!Array.isArray(roster)) return this.players;
    this.players = roster.filter(Boolean).map((p, i) => ({
      name: p.name || `Player ${i + 1}`,
      score: 0,
      color: p.color || "purple-500",
      avatar: p.avatar || DEFAULT_AVATAR_ID,
    }));
    return this.players;
  }

  // Initialize score manager with game settings
  initialize(gameMode, settings) {
    this.score = 0;
    this.currentRound = 0;
    this.responseTimeHistory = [];

    if (settings.lives && gameMode === "solo") {
      this.lives = settings.lives === "unlimited" ? Infinity : parseInt(settings.lives, 10);
      this.remainingLives = this.lives;
    }

    // Update UI elements
    document.getElementById("current-score").textContent = this.score;

    const livesDisplay = document.getElementById("lives-display");
    const livesCount = document.getElementById("lives-count");

    if (gameMode === "solo" && livesDisplay && livesCount) {
      livesDisplay.classList.remove("hidden");

      if (this.lives === Infinity) {
        livesCount.textContent = "∞";
      } else {
        livesCount.textContent = this.remainingLives;
      }
    }
  }

  // Add score for correct answer
  addScore(points = 1) {
    this.score += points;
    document.getElementById("current-score").textContent = this.score;
    return this.score;
  }

  // Reduce lives (for Marathon mode)
  reduceLives() {
    if (this.lives !== Infinity) {
      this.remainingLives--;
      document.getElementById("lives-count").textContent = this.remainingLives;

      // Visual effect for losing a life
      const livesDisplay = document.getElementById("lives-display");
      if (livesDisplay) {
        livesDisplay.classList.add("animate-pulse");
        setTimeout(() => {
          livesDisplay.classList.remove("animate-pulse");
        }, 1000);
      }
    }
    return this.remainingLives;
  }

  // Award a life on marathon checkpoints.
  addLife(points = 1) {
    if (this.lives === Infinity) return this.remainingLives;
    this.remainingLives += points;
    const livesCount = document.getElementById("lives-count");
    if (livesCount) livesCount.textContent = this.remainingLives;
    return this.remainingLives;
  }

  // Check if game over (no lives left)
  isGameOver() {
    return this.lives !== Infinity && this.remainingLives <= 0;
  }

  // Get current score
  getScore() {
    return this.score;
  }

  // Get remaining lives
  getRemainingLives() {
    return this.remainingLives;
  }

  // Increment round counter
  nextRound() {
    this.currentRound++;
    return this.currentRound;
  }

  // Get current round
  getCurrentRound() {
    return this.currentRound;
  }

  // Add response time for statistics
  addResponseTime(time) {
    this.responseTimeHistory.push(time);
  }

  // Get average response time
  getAverageResponseTime() {
    if (this.responseTimeHistory.length === 0) return 0;
    return (
      this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length / 1000
    );
  }

  // Calculate accuracy percentage
  getAccuracy() {
    if (this.currentRound === 0) return 0;
    return Math.round((this.score / this.currentRound) * 100);
  }

  // Generate mock players for multiplayer demo
  generateMockPlayers() {
    const playerNames = ["Sen", "Ahmet", "Zeynep", "Burak"];
    const playerColors = ["purple-500", "blue-500", "green-500", "yellow-500"];
    const avatars = [...AVATAR_IDS];

    this.players = [];

    playerNames.forEach((name, i) => {
      const avatar =
        i === 0 ? getEffectiveAvatarId() : avatars[Math.floor(Math.random() * avatars.length)];

      this.players.push({
        name,
        score: 0,
        color: playerColors[i],
        avatar: avatar,
      });
    });

    return this.players;
  }

  // Update player score in multiplayer
  updatePlayerScore(playerIndex, points) {
    if (this.players[playerIndex]) {
      this.players[playerIndex].score += points;

      const playerElements = document.querySelectorAll("#players-list > div");
      if (playerElements[playerIndex]) {
        const scoreElement = playerElements[playerIndex].querySelector("div:last-child");
        if (scoreElement) {
          scoreElement.textContent = this.players[playerIndex].score;
        }
      }
    }
  }

  // Get sorted players by score
  getSortedPlayers() {
    return [...this.players].sort((a, b) => b.score - a.score);
  }

  // Reset score and stats
  reset() {
    this.score = 0;
    this.currentRound = 0;
    this.remainingLives = this.lives;
    this.responseTimeHistory = [];
    this.players = [];

    // Update UI
    document.getElementById("current-score").textContent = this.score;
    const livesCount = document.getElementById("lives-count");
    if (livesCount) {
      if (this.lives === Infinity) {
        livesCount.textContent = "∞";
      } else {
        livesCount.textContent = this.remainingLives;
      }
    }
  }

  // Get game statistics object
  getGameStats() {
    return {
      score: this.score,
      rounds: this.currentRound,
      accuracy: this.getAccuracy(),
      averageResponseTime: this.getAverageResponseTime(),
      remainingLives: this.remainingLives,
      totalLives: this.lives,
    };
  }
}
