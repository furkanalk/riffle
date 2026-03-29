// game-engine.js

import { avatarImgSrcFromRoot, normalizeAvatarId } from "../core/avatars.js";
import { getTracksFromGenre, resetPlayedTracks } from "../core/music.js";
import { getEffectiveAvatarId } from "../core/user-manager.js";
import { AudioManager } from "./audio-manager.js";
import { ScoreManager } from "./score-manager.js";
import { clampAnswerWindowSec, computeAnswerPoints } from "./scoring.js";
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
    /** @type {number | undefined} */
    this.roundAnswerPhaseStartMs;
    this.lastRoundPointsEarned = 0;
  }

  /** Seconds allowed to answer (solo preview + VS timer); uses saved time limit when set. */
  getAnswerWindowSeconds() {
    const t = Number(this.settings.timeLimit);
    const p = Number(this.settings.previewLength);
    const raw = Number.isFinite(t) && t > 0 ? t : Number.isFinite(p) && p > 0 ? p : 15;
    return clampAnswerWindowSec(raw);
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
      this.timerManager.setTimeLimit(this.getAnswerWindowSeconds());

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
      }
    }

    const avatar = normalizeAvatarId(this.settings.avatar || getEffectiveAvatarId());
    const avatarElement = document.getElementById("player-avatar");
    if (avatarElement) {
      avatarElement.src = avatarImgSrcFromRoot(avatar);
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
      this.lastRoundPointsEarned = 0;

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

    const answerSec = this.getAnswerWindowSeconds();
    this.roundAnswerPhaseStartMs = performance.now();

    // Start timers
    if (this.gameMode !== "solo") {
      this.timerManager.startTimer(() => this.handleTimeout());
    }

    this.timerManager.startPreviewTimeout(answerSec, () => this.handleTimeout());

    // Add continue button for VS modes after preview
    if (this.gameMode !== "solo") {
      setTimeout(
        () => {
          this.addContinueButton();
        },
        answerSec * 1000 + 100
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

  // Generate answer options (plausible distractors: same-artist songs, same-genre artists, etc.)
  generateAnswerOptions() {
    const questionType = this.currentQuestionType || "artist";
    const currentTrack = this.currentTrack;
    const pool = Array.isArray(this.currentPlaylistTracks) ? this.currentPlaylistTracks : [];
    const correct = this.correctAnswer;

    const normArtist = (a) =>
      String(a || "")
        .trim()
        .toLowerCase();
    const normAlbum = (a) =>
      String(a || "")
        .trim()
        .toLowerCase();
    const normSong = (title) => this.uiManager.cleanSongTitle(title || "");

    const extractSong = (t) => normSong(t.title);
    const extractArtist = (t) => String(t.artist || "").trim() || "Unknown Artist";
    const extractAlbum = (t) => String(t.album?.title || "").trim() || "Unknown Album";
    const extractGuitarist = (t) =>
      String(t.guitarist || t.artist || "").trim() || "Unknown Artist";

    const options = new Set([correct]);
    const notCurrent = (t) => t.id !== currentTrack.id;

    const pushFromTracks = (tracks, extractFn) => {
      for (const t of this.uiManager.shuffleArray([...tracks])) {
        const value = extractFn(t);
        if (!value) continue;
        if (questionType === "song" && normSong(value) === normSong(correct)) continue;
        if (questionType === "artist" && normArtist(value) === normArtist(correct)) continue;
        if (questionType === "album" && normAlbum(value) === normAlbum(correct)) continue;
        if (questionType === "guitarist" && normArtist(value) === normArtist(correct)) continue;
        if (!options.has(value)) options.add(value);
        if (options.size >= 4) break;
      }
    };

    if (questionType === "song") {
      const sameArtistOther = pool.filter(
        (t) => notCurrent(t) && normArtist(t.artist) === normArtist(currentTrack.artist)
      );
      const sameAlbumOther = currentTrack.album?.title
        ? pool.filter(
            (t) =>
              notCurrent(t) &&
              t.album?.title &&
              normAlbum(t.album.title) === normAlbum(currentTrack.album.title)
          )
        : [];
      const restPool = pool.filter(notCurrent);
      pushFromTracks(sameArtistOther, extractSong);
      pushFromTracks(sameAlbumOther, extractSong);
      pushFromTracks(restPool, extractSong);
      pushFromTracks(this.playedTracks.filter(notCurrent), extractSong);
    } else if (questionType === "artist") {
      const otherArtistTracks = pool.filter(
        (t) => notCurrent(t) && t.artist && normArtist(t.artist) !== normArtist(currentTrack.artist)
      );
      pushFromTracks(otherArtistTracks, extractArtist);
      pushFromTracks(
        this.playedTracks.filter(
          (t) =>
            notCurrent(t) && t.artist && normArtist(t.artist) !== normArtist(currentTrack.artist)
        ),
        extractArtist
      );
    } else if (questionType === "album") {
      const otherAlbumTracks = pool.filter(
        (t) => notCurrent(t) && t.album?.title && normAlbum(t.album.title) !== normAlbum(correct)
      );
      pushFromTracks(otherAlbumTracks, extractAlbum);
      pushFromTracks(pool.filter(notCurrent), extractAlbum);
      pushFromTracks(this.playedTracks.filter(notCurrent), extractAlbum);
    } else if (questionType === "guitarist") {
      const otherG = pool.filter(
        (t) => notCurrent(t) && normArtist(extractGuitarist(t)) !== normArtist(correct)
      );
      pushFromTracks(otherG, extractGuitarist);
      pushFromTracks(this.playedTracks.filter(notCurrent), extractGuitarist);
    } else {
      pushFromTracks(
        pool.filter(
          (t) =>
            notCurrent(t) && t.artist && normArtist(t.artist) !== normArtist(currentTrack.artist)
        ),
        extractArtist
      );
    }

    let finalOptions = [...options];
    finalOptions = finalOptions.slice(0, 4);
    const wrongOnly = finalOptions.filter((o) => o !== correct);
    let i = 0;
    while (finalOptions.length < 4 && wrongOnly.length > 0) {
      finalOptions.push(wrongOnly[i % wrongOnly.length]);
      i++;
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

    const answerStart = this.roundAnswerPhaseStartMs ?? performance.now();
    const elapsedMs = performance.now() - answerStart;
    const answerSec = this.getAnswerWindowSeconds();

    // Update score
    if (isCorrect) {
      const pts = computeAnswerPoints(elapsedMs, answerSec);
      this.lastRoundPointsEarned = pts;
      this.scoreManager.recordCorrectAnswer(pts);
      this.scoreManager.addResponseTime(elapsedMs);
      this.uiManager.createConfetti();
    } else {
      this.lastRoundPointsEarned = 0;
      // Reduce lives in Marathon mode
      if (this.gameMode === "solo") {
        this.scoreManager.reduceLives();
      }
    }

    // Update multiplayer scores
    if (["versus", "team", "coop"].includes(this.gameMode)) {
      this.scoreManager.updatePlayerScore(0, isCorrect ? this.lastRoundPointsEarned : 0, isCorrect);
    }

    // Continue after delay
    setTimeout(() => this.checkGameProgress(), 2000);
  }

  // Handle timeout (no answer selected)
  handleTimeout() {
    if (this.timerManager.handleTimeout()) {
      this.lastRoundPointsEarned = 0;
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
      lastRoundPoints: this.lastRoundPointsEarned,
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
