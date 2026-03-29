// score-manager.js
import { AVATAR_IDS, DEFAULT_AVATAR_ID } from "../core/avatars.js";
import { getEffectiveAvatarId } from "../core/user-manager.js";

export class ScoreManager {
  constructor() {
    this.score = 0;
    /** Number of correct answers this run (separate from point total). */
    this.correctCount = 0;
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
      correctCount: 0,
      color: p.color || "purple-500",
      avatar: p.avatar || DEFAULT_AVATAR_ID,
    }));
    return this.players;
  }

  // Initialize score manager with game settings
  initialize(gameMode, _settings) {
    this.score = 0;
    this.correctCount = 0;
    this.currentRound = 0;
    this.responseTimeHistory = [];

    if (gameMode === "solo") {
      // Marathon: always exactly one starting life; checkpoints add more. No "unlimited lives".
      this.lives = 1;
      this.remainingLives = 1;
    }

    this.updateScoreHud();

    const livesDisplay = document.getElementById("lives-display");
    const livesCount = document.getElementById("lives-count");

    if (gameMode === "solo" && livesDisplay && livesCount) {
      livesDisplay.classList.remove("hidden");
      livesCount.textContent = String(this.remainingLives);
    }
  }

  updateScoreHud() {
    const scoreEl = document.getElementById("current-score");
    if (scoreEl) scoreEl.textContent = this.score;
    const correctEl = document.getElementById("hud-correct-count");
    if (correctEl) correctEl.textContent = String(this.correctCount);
  }

  /** Add points without incrementing correct count (extensions / bonuses). */
  addScore(points = 0) {
    this.score += points;
    this.updateScoreHud();
    return this.score;
  }

  /** Correct answer: adds points and increments correctCount. */
  recordCorrectAnswer(points) {
    this.correctCount++;
    this.score += points;
    this.updateScoreHud();
    return this.score;
  }

  // Reduce lives (for Marathon mode)
  reduceLives() {
    this.remainingLives--;
    const livesCount = document.getElementById("lives-count");
    if (livesCount) livesCount.textContent = String(this.remainingLives);

    const livesDisplay = document.getElementById("lives-display");
    if (livesDisplay) {
      livesDisplay.classList.add("animate-pulse");
      setTimeout(() => {
        livesDisplay.classList.remove("animate-pulse");
      }, 1000);
    }
    return this.remainingLives;
  }

  // Award a life on marathon checkpoints.
  addLife(points = 1) {
    this.remainingLives += points;
    const livesCount = document.getElementById("lives-count");
    if (livesCount) livesCount.textContent = this.remainingLives;
    return this.remainingLives;
  }

  // Check if game over (no lives left)
  isGameOver() {
    return this.remainingLives <= 0;
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

  // Calculate accuracy percentage (correct answers / rounds played)
  getAccuracy() {
    if (this.currentRound === 0) return 0;
    return Math.round((this.correctCount / this.currentRound) * 100);
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
        correctCount: 0,
        color: playerColors[i],
        avatar: avatar,
      });
    });

    return this.players;
  }

  // Update player score in multiplayer
  updatePlayerScore(playerIndex, points, isCorrect = false) {
    if (this.players[playerIndex]) {
      this.players[playerIndex].score += points;
      if (isCorrect) {
        this.players[playerIndex].correctCount = (this.players[playerIndex].correctCount || 0) + 1;
      }

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
    this.correctCount = 0;
    this.currentRound = 0;
    this.remainingLives = this.lives;
    this.responseTimeHistory = [];
    this.players = [];

    // Update UI
    this.updateScoreHud();
    const livesCount = document.getElementById("lives-count");
    if (livesCount) {
      livesCount.textContent = String(this.remainingLives);
    }
  }

  // Get game statistics object
  getGameStats() {
    return {
      score: this.score,
      correctCount: this.correctCount,
      rounds: this.currentRound,
      accuracy: this.getAccuracy(),
      averageResponseTime: this.getAverageResponseTime(),
      remainingLives: this.remainingLives,
      totalLives: this.lives,
    };
  }
}
