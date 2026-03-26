// game-engine.js

import { getTracksFromGenre, resetPlayedTracks } from "../core/music.js";
import { getEffectiveAvatarId } from "../core/user-manager.js";
import { AudioManager } from "./audio-manager.js";
import { ScoreManager } from "./score-manager.js";
import { TimerManager } from "./timer-manager.js";
import { UIManager } from "./ui-manager.js";

export class GameEngine {
  constructor() {
    this.audioManager = new AudioManager();
    this.timerManager = new TimerManager();
    this.scoreManager = new ScoreManager();
    this.uiManager = new UIManager();

    // Game state
    this.totalRounds = 10;
    this.currentTrack = null;
    this.correctAnswer = "";
    this.currentQuestionType = "artist";
    this.lastQuestionType = null;
    this.gameMode = "";
    this.settings = {
      categories: [],
      questionType: "mixed",
      previewLength: 10,
      lives: "3",
    };
    this.playedTracks = [];
    this.currentPlaylistTracks = [];
    this.answerSelected = false;
    this.marathonCheckpointInterval = 10;
  }

  // Initialize the game
  async initialize() {
    try {
      // Get game mode and settings
      this.gameMode = new URLSearchParams(window.location.search).get("mode") || "solo";
      this.loadGameSettings();

      // Reset track history
      resetPlayedTracks();

      // Initialize managers
      this.scoreManager.initialize(this.gameMode, this.settings);
      this.timerManager.setTimeLimit(this.settings.timeLimit || 15);

      // Setup UI based on game mode
      const players = this.setupGameMode();
      this.uiManager.setupGameMode(this.gameMode, this.settings, players);

      // Initialize audio
      await this.audioManager.initializeAudio();

      // Show loading and start game
      await this.uiManager.simulateLoading();

      // Start first round
      this.startNewRound();

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error("Game initialization failed:", error);
      alert("Failed to initialize the game. Please refresh the page.");
    }
  }

  // Load game settings from localStorage
  loadGameSettings() {
    const savedSettings = localStorage.getItem("riffleGameSettings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      this.settings = { ...this.settings, ...parsed };

      if (this.settings.rounds && this.settings.rounds !== "unlimited") {
        this.totalRounds = parseInt(this.settings.rounds, 10);
        document.getElementById("max-score").textContent = this.totalRounds;
      } else if (this.gameMode === "solo") {
        document.getElementById("max-score").textContent = "∞";
      }
    }

    const avatar = this.settings.avatar || getEffectiveAvatarId();
    const avatarElement = document.getElementById("player-avatar");
    if (avatarElement) {
      avatarElement.src = `./src/img/avatars/${avatar}.png`;
    }
  }

  // Setup game mode specific configuration
  setupGameMode() {
    let players = null;

    if (["versus", "team", "coop"].includes(this.gameMode)) {
      const raw = localStorage.getItem("riffleRoomPlayers");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          players = this.scoreManager.setPlayers(parsed);
        } catch {
          players = this.scoreManager.generateMockPlayers();
        }
      } else {
        players = this.scoreManager.generateMockPlayers();
      }
    }

    return players;
  }

  // Start a new round
  async startNewRound() {
    try {
      // Check if game should end
      if (
        this.settings.rounds !== "unlimited" &&
        this.scoreManager.getCurrentRound() >= this.totalRounds
      ) {
        this.endGame();
        return;
      }

      // Check if player ran out of lives
      if (this.scoreManager.isGameOver()) {
        this.showRoundCompletionScreen(true);
        return;
      }

      // Clean up previous round
      this.cleanupPreviousRound();

      // Increment round
      const currentRound = this.scoreManager.nextRound();

      // Update round info
      this.uiManager.updateRoundInfo(
        currentRound,
        this.totalRounds,
        this.settings.rounds === "unlimited",
        this.marathonCheckpointInterval
      );

      // Reset UI for new round
      this.uiManager.resetUI();
      this.audioManager.createMusicVisualizer();
      this.timerManager.resetTimer();

      // Get random track and source playlist for dynamic question generation
      const roundData = await this.getRandomTrack();
      const track = roundData.track;
      this.currentPlaylistTracks = roundData.playlistTracks;
      this.currentTrack = track;
      this.audioManager.setCurrentTrack(track);

      // Prepare question
      const { questionText, genreInfo, correctAnswer, questionType } = this.prepareQuestion(track);
      this.correctAnswer = correctAnswer;
      this.currentQuestionType = questionType;

      // Update question display
      this.uiManager.updateQuestion(questionText, genreInfo);

      // Generate and set answer options
      const answerOptions = this.generateAnswerOptions();
      this.uiManager.setAnswerOptions(answerOptions);

      // Start the round with delay
      setTimeout(() => {
        this.startRound();
      }, 1000);
    } catch (error) {
      console.error("Error starting new round:", error);
      alert("An error occurred while loading the track. Please try again.");
    }
  }

  // Clean up from previous round
  cleanupPreviousRound() {
    const timeoutBtn = document.getElementById("timeout-next-btn");
    if (timeoutBtn?.parentNode) {
      timeoutBtn.parentNode.removeChild(timeoutBtn);
    }

    const manualNextBtn = document.getElementById("manual-next-btn");
    if (manualNextBtn?.parentNode) {
      manualNextBtn.parentNode.removeChild(manualNextBtn);
    }

    this.timerManager.cleanup();
    this.answerSelected = false;
  }

  // Start the round (play music, start timers)
  startRound() {
    // Visual effects
    const pulseEffect = document.createElement("div");
    pulseEffect.className = "fixed inset-0 bg-purple-900 bg-opacity-10 z-20";
    document.body.appendChild(pulseEffect);

    pulseEffect.animate([{ opacity: 0.2 }, { opacity: 0 }], {
      duration: 800,
      easing: "ease-out",
    }).onfinish = () => pulseEffect.remove();

    // Play music
    this.audioManager.playMusic();

    // Start timers
    if (this.gameMode !== "solo") {
      this.timerManager.startTimer(() => this.handleTimeout());
    }

    this.timerManager.startPreviewTimeout(this.settings.previewLength, () => this.handleTimeout());

    // Add continue button for VS modes after preview
    if (this.gameMode !== "solo") {
      setTimeout(
        () => {
          this.addContinueButton();
        },
        this.settings.previewLength * 1000 + 100
      );
    }
  }

  // Get random track based on settings
  async getRandomTrack() {
    const categoryId =
      this.settings.categories && this.settings.categories.length > 0
        ? this.settings.categories[Math.floor(Math.random() * this.settings.categories.length)]
        : "rock_80s";

    const playlistTracks = await getTracksFromGenre(categoryId);
    const playedIds = new Set(this.playedTracks.map((t) => t.id));
    const availableTracks = playlistTracks.filter((t) => !playedIds.has(t.id));
    const sourceTracks = availableTracks.length > 0 ? availableTracks : playlistTracks;
    const track = sourceTracks[Math.floor(Math.random() * sourceTracks.length)];

    this.playedTracks.push(track);
    return { track, playlistTracks };
  }

  // Prepare question based on track and settings
  prepareQuestion(track) {
    const countUnique = (type) => {
      const source = [...(this.currentPlaylistTracks || []), track];
      const values = source
        .map((t) => {
          if (type === "song") return this.uiManager.cleanSongTitle(t.title || "");
          if (type === "album") return t.album?.title || "";
          return t.artist || "";
        })
        .filter(Boolean);
      return new Set(values).size;
    };

    // Always randomize question type (Song / Artist / Album)
    const candidates = [
      { type: "song", weight: 0.45, unique: countUnique("song") },
      { type: "artist", weight: 0.4, unique: countUnique("artist") },
      { type: "album", weight: 0.15, unique: countUnique("album") },
    ].filter((c) => c.unique >= 2);

    const safeCandidates =
      candidates.length > 0 ? candidates : [{ type: "song", weight: 1, unique: 1 }];
    const withoutRepeat = safeCandidates.filter((c) => c.type !== this.lastQuestionType);
    const weightedPool = withoutRepeat.length > 0 ? withoutRepeat : safeCandidates;

    const totalWeight = weightedPool.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * totalWeight;
    let questionType = weightedPool[weightedPool.length - 1].type;
    for (const c of weightedPool) {
      roll -= c.weight;
      if (roll <= 0) {
        questionType = c.type;
        break;
      }
    }

    let questionText, correctAnswer;
    const genreInfo = track.genreName || "Rock/Metal";

    switch (questionType) {
      case "song":
        questionText = "Which song is this?";
        track.cleanTitle = this.uiManager.cleanSongTitle(track.title);
        correctAnswer = track.cleanTitle;
        break;
      case "artist":
        questionText = "Which artist/band performs this track?";
        correctAnswer = track.artist;
        break;
      case "album":
        questionText = "Which album is this track from?";
        correctAnswer = track.album?.title || "Unknown Album";
        break;
      case "guitarist":
        questionText = "Who is the guitarist for this track?";
        correctAnswer = track.guitarist || track.artist;
        break;
      default:
        questionText = "Which artist/band performs this track?";
        correctAnswer = track.artist;
    }

    this.lastQuestionType = questionType;
    return { questionText, genreInfo, correctAnswer, questionType };
  }

  // Generate answer options
  generateAnswerOptions() {
    const questionType = this.currentQuestionType || "artist";
    const currentTrack = this.currentTrack;
    const pool = Array.isArray(this.currentPlaylistTracks) ? this.currentPlaylistTracks : [];
    const options = new Set([this.correctAnswer]);

    const normalizedTitle = (title) => this.uiManager.cleanSongTitle(title || "");
    const extract = (track) => {
      if (questionType === "song") return normalizedTitle(track.title);
      if (questionType === "album") return track.album?.title || "Unknown Album";
      return track.artist || "Unknown Artist";
    };

    const sameArtist = pool.filter(
      (t) => t.artist === currentTrack.artist && t.id !== currentTrack.id
    );
    const sameAlbum = pool.filter(
      (t) =>
        t.album?.title && t.album?.title === currentTrack.album?.title && t.id !== currentTrack.id
    );

    const pushFrom = (list) => {
      for (const t of this.uiManager.shuffleArray([...list])) {
        const value = extract(t);
        if (value && !options.has(value)) options.add(value);
        if (options.size >= 4) break;
      }
    };

    const otherTracks = pool.filter((t) => t.id !== currentTrack.id);

    // Balanced default difficulty: mixed distractors with preference for close options
    pushFrom(this.uiManager.shuffleArray([...sameArtist, ...sameAlbum]));
    pushFrom(this.uiManager.shuffleArray([...otherTracks]));

    // Last-resort fallback from previously played tracks (also from Deezer)
    pushFrom(this.playedTracks.filter((t) => t.id !== currentTrack.id));

    const finalOptions = [...options].slice(0, 4);
    const recycle = finalOptions.length > 0 ? [...finalOptions] : [this.correctAnswer];
    while (finalOptions.length < 4) {
      finalOptions.push(recycle[finalOptions.length % recycle.length]);
    }

    return this.uiManager.shuffleArray(finalOptions);
  }

  // Add continue button for VS modes
  addContinueButton() {
    if (!this.answerSelected) {
      const questionContainer = document.querySelector(".question-container");
      if (questionContainer && !document.getElementById("manual-next-btn")) {
        const nextBtn = document.createElement("button");
        nextBtn.id = "manual-next-btn";
        nextBtn.className =
          "bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4 transition duration-300";
        nextBtn.textContent = "Continue";
        nextBtn.onclick = () => {
          if (nextBtn.parentNode) {
            nextBtn.parentNode.removeChild(nextBtn);
          }
          this.showRoundCompletionScreen(false);
        };
        questionContainer.appendChild(nextBtn);
      }
    }
  }

  // Handle answer selection
  handleAnswerClick(selectedButton) {
    const selectedAnswer = selectedButton.dataset.answer;

    // Mark answer as selected
    this.answerSelected = true;
    this.timerManager.setAnswerSelected(true);

    // Stop timers
    this.timerManager.stopTimer();
    this.timerManager.clearPreviewTimeout();

    // Check if answer is correct
    const isCorrect = selectedAnswer === this.correctAnswer;

    // Update UI
    this.uiManager.markButtonSelected(selectedButton, isCorrect, this.correctAnswer);

    // Update score
    if (isCorrect) {
      this.scoreManager.addScore();
      this.uiManager.createConfetti();
    } else {
      // Reduce lives in Marathon mode
      if (this.gameMode === "solo") {
        this.scoreManager.reduceLives();
      }
    }

    // Update multiplayer scores
    if (["versus", "team", "coop"].includes(this.gameMode)) {
      this.scoreManager.updatePlayerScore(0, isCorrect ? 1 : 0);
    }

    // Continue after delay
    setTimeout(() => this.checkGameProgress(), 2000);
  }

  // Handle timeout (no answer selected)
  handleTimeout() {
    if (this.timerManager.handleTimeout()) {
      // Show timeout UI
      this.uiManager.handleTimeoutUI(this.correctAnswer, this.answerSelected);

      // Reduce lives for Marathon mode
      if (this.gameMode === "solo") {
        this.scoreManager.reduceLives();
      }

      // Continue after delay
      setTimeout(() => this.checkGameProgress(), 1200);
    }
  }

  // Check game progress and decide next action
  checkGameProgress() {
    // Check if game should end
    if (this.scoreManager.isGameOver()) {
      this.showRoundCompletionScreen(true);
      return;
    }

    // Marathon checkpoint: every 10 completed questions grants +1 life.
    if (
      this.gameMode === "solo" &&
      this.scoreManager.getCurrentRound() > 0 &&
      this.scoreManager.getCurrentRound() % this.marathonCheckpointInterval === 0
    ) {
      this.scoreManager.addLife(1);
    }

    // Show round completion screen
    this.showRoundCompletionScreen();
  }

  // Show round completion screen
  showRoundCompletionScreen(isGameOver = false) {
    // Allow music to continue if not paused
    if (this.audioManager.musicPlayer.paused) {
      this.audioManager.stopMusicVisualizer();
    }

    // Prepare score data
    const scoreData = {
      ...this.scoreManager.getGameStats(),
      gameMode: this.gameMode,
      avatar: this.settings.avatar || getEffectiveAvatarId(),
      totalRounds: this.totalRounds,
      players: this.scoreManager.players,
    };

    // Show completion screen
    this.uiManager.showRoundCompletionScreen(this.currentTrack, scoreData, isGameOver, () => {
      this.audioManager.pauseMusic();

      if (
        isGameOver ||
        (this.settings.rounds !== "unlimited" &&
          this.scoreManager.getCurrentRound() >= this.totalRounds)
      ) {
        this.endGame();
      } else {
        this.startNewRound();
      }
    });
  }

  // End the game and show final results
  endGame() {
    this.audioManager.pauseMusic();

    const scoreData = {
      ...this.scoreManager.getGameStats(),
      gameMode: this.gameMode,
      avatar: this.settings.avatar || getEffectiveAvatarId(),
      totalRounds: this.totalRounds,
      players: this.scoreManager.getSortedPlayers(),
      playedTracks: this.playedTracks,
    };

    this.uiManager.showFinalResults(
      scoreData,
      () => window.location.reload(), // Replay
      () => {
        window.location.href = "../../index.html";
      } // Main menu
    );
  }

  // Setup event listeners
  setupEventListeners() {
    // Answer button clicks
    this.uiManager.answerButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!this.answerSelected) {
          this.handleAnswerClick(e.currentTarget);
        }
      });
    });

    // Audio manager page interaction setup
    this.audioManager.setupPageInteractionHandlers();

    // Main menu button
    const mainMenuBtn = document.getElementById("mainMenuBtn");
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener("click", () => {
        window.location.href = "../../index.html";
      });
    }
  }

  // Cleanup when game ends
  cleanup() {
    this.timerManager.cleanup();
    this.audioManager.pauseMusic();
  }
}
