// ui-manager.js
import { avatarImgSrcFromRoot, DEFAULT_AVATAR_ID, normalizeAvatarId } from "../core/avatars.js";
import { getLang, t, tVar } from "../core/i18n.js";
import { submitScoreIfLoggedIn } from "../core/leaderboard-submit.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Local SVG fallback — no external request, no DNS failure
const COVER_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="200" height="200" rx="12" fill="#180D30"/>' +
      '<path d="M78 58 L78 128 Q78 142 94 145 Q110 148 110 134 Q110 120 94 123 L94 82 L138 70 L138 120 Q138 134 154 137 Q170 140 170 126 Q170 112 154 115 L154 48 Z" fill="#7C3AED" opacity="0.75"/>' +
      "</svg>"
  );

const FAV_TRACKS_KEY = "riffle_favorite_tracks_v1";

function getFavoritesStorageKey() {
  try {
    const rawUser = localStorage.getItem("user") || localStorage.getItem("user_profile") || "{}";
    const user = JSON.parse(rawUser);
    const suffix = user?.id ?? user?.username ?? "guest";
    return `${FAV_TRACKS_KEY}:${String(suffix)}`;
  } catch {
    return `${FAV_TRACKS_KEY}:guest`;
  }
}

/** Subline after a correct answer — needs enough rounds before “on fire” etc. */
function roundCompletionDetailKeyCorrect(scoreData) {
  const rounds = Number(scoreData?.rounds ?? 0);
  const acc = Number(scoreData?.accuracy ?? 0);
  if (rounds <= 1) return "gamePage.roundMsgCorrect1";
  if (rounds === 2) return "gamePage.roundMsgCorrect2";
  if (rounds < 5) {
    return acc === 100 ? "gamePage.roundMsgCorrectEarlyPerfect" : "gamePage.roundMsgCorrectEarly";
  }
  if (rounds >= 6 && acc >= 80) return "gamePage.roundMsgCorrectHot";
  if (rounds >= 5 && acc >= 65) return "gamePage.roundMsgCorrectStrong";
  if (rounds >= 4 && acc >= 50) return "gamePage.roundMsgCorrectSolid";
  return "gamePage.roundMsgCorrectNeutral";
}

function roundCompletionDetailKeyWrong(scoreData) {
  const rounds = Number(scoreData?.rounds ?? 0);
  const acc = Number(scoreData?.accuracy ?? 0);
  if (rounds <= 2) return "gamePage.roundWrongEarly";
  if (acc >= 60) return "gamePage.roundWrongStillGood";
  return "gamePage.roundWrongMsg";
}

function roundCompletionDetailKeyTimeout(scoreData) {
  const rounds = Number(scoreData?.rounds ?? 0);
  if (rounds <= 2) return "gamePage.roundTimeUpEarly";
  return "gamePage.roundTimeUpMsg";
}

function getFavoriteTrackKey(track) {
  if (track?.id !== undefined && track?.id !== null) {
    return `deezer:${String(track.id)}`;
  }
  return `${String(track?.title || "").trim()}::${String(track?.artist || "").trim()}`;
}

function readFavoriteTracks() {
  try {
    const raw = localStorage.getItem(getFavoritesStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavoriteTracks(items) {
  localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(items));
}

export class UIManager {
  /** Plak giriş animasyonu süresi (ms); şıklar bundan sonra sırayla gelir. */
  static VINYL_INTRO_MS = 720;

  constructor() {
    this.answerButtons = document.querySelectorAll(".answer-btn");
    this.loadingScreen = document.getElementById("loading-screen");
    this.roundCompletion = document.getElementById("round-completion");
    this.resultsModal = document.getElementById("results-modal");
    /** @type {number | undefined} */
    this.favToastTimer;
    /** @type {number | undefined} */
    this.favToastHideTimer;
    /** @type {number | undefined} */
    this._roundRevealStripTimer;
    /** @type {number | undefined} */
    this._vinylStripTimer;
    /** @type {number | undefined} */
    this._vinylPhaseStartMs;
  }

  async loadFinalModeLeaderboard(mode) {
    const loadingEl = document.getElementById("final-mode-leaderboard-loading");
    const emptyEl = document.getElementById("final-mode-leaderboard-empty");
    const podiumEl = document.getElementById("final-mode-leaderboard-podium");
    const othersEl = document.getElementById("final-mode-leaderboard-others");
    if (!loadingEl || !emptyEl || !podiumEl || !othersEl) return;

    const safeMode = String(mode ?? "solo").slice(0, 20);

    loadingEl.textContent = "Loading leaderboard…";
    loadingEl.classList.remove("hidden");
    emptyEl.classList.add("hidden");
    podiumEl.classList.add("hidden");
    othersEl.classList.add("hidden");
    podiumEl.innerHTML = "";
    othersEl.innerHTML = "";

    /** @param {Record<string, unknown> | undefined} entry */
    const podiumSlot = (entry, variant) => {
      if (!entry) {
        return `<div class="final-lb-ghost final-lb-ghost--${variant}" aria-hidden="true"></div>`;
      }
      const avatar = normalizeAvatarId(entry.avatar || DEFAULT_AVATAR_ID);
      const name = escapeHtml(entry.username || "Guest");
      const score = escapeHtml(String(entry.score ?? 0));
      const rankLabel = variant === "gold" ? "1st" : variant === "silver" ? "2nd" : "3rd";
      return `
        <div class="final-lb-slot final-lb-slot--${variant}">
          <div class="final-lb-rank">${rankLabel}</div>
          <div class="final-lb-ring">
            <img src="${avatarImgSrcFromRoot(avatar)}" alt="" />
          </div>
          <div class="final-lb-name">${name}</div>
          <div class="final-lb-score">${score} pts</div>
          <div class="final-lb-pedestal"></div>
        </div>
      `;
    };

    try {
      const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(safeMode)}&limit=10`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Leaderboard load failed");

      const entries = Array.isArray(data.entries) ? data.entries : [];
      if (entries.length === 0) {
        loadingEl.classList.add("hidden");
        emptyEl.classList.remove("hidden");
        return;
      }

      loadingEl.classList.add("hidden");

      const first = entries[0];
      const second = entries[1];
      const third = entries[2];
      const rest = entries.slice(3);

      podiumEl.innerHTML = `
        <div class="final-lb-strip" role="list">
          ${podiumSlot(second, "silver")}
          ${podiumSlot(first, "gold")}
          ${podiumSlot(third, "bronze")}
        </div>
      `;
      podiumEl.classList.remove("hidden");

      if (rest.length > 0) {
        const rows = rest
          .map((e, i) => {
            const idx = i + 4;
            const avatar = normalizeAvatarId(e.avatar || DEFAULT_AVATAR_ID);
            const name = escapeHtml(e.username || "Guest");
            const score = escapeHtml(String(e.score ?? 0));
            return `
              <div class="final-lb-row">
                <div class="final-lb-row-rank">${idx}</div>
                <div class="final-lb-row-ring">
                  <img src="${avatarImgSrcFromRoot(avatar)}" alt="" />
                </div>
                <div class="final-lb-row-body">
                  <div class="final-lb-row-top">
                    <div class="final-lb-row-name">${name}</div>
                    <div class="final-lb-row-score">${score} pts</div>
                  </div>
                  <div class="final-lb-row-mode">${escapeHtml(String(e.game_mode || safeMode))}</div>
                </div>
              </div>
            `;
          })
          .join("");
        othersEl.innerHTML = `<div class="final-lb-rest-grid">${rows}</div>`;
        othersEl.classList.remove("hidden");
      }
    } catch (e) {
      loadingEl.textContent = e instanceof Error ? e.message : "Could not load leaderboard.";
    }
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

  /** Clear question/answers and mark UI as “loading track” (vinyl + timer + şıklar hidden until reveal). */
  prepareRoundFetchSurface() {
    if (this._roundRevealStripTimer != null) {
      clearTimeout(this._roundRevealStripTimer);
      this._roundRevealStripTimer = undefined;
    }
    if (this._vinylStripTimer != null) {
      clearTimeout(this._vinylStripTimer);
      this._vinylStripTimer = undefined;
    }
    this._vinylPhaseStartMs = undefined;
    const shell = document.getElementById("round-challenge-shell");
    shell?.classList.remove(
      "round-challenge-shell--reveal-play-surface",
      "round-challenge-shell--vinyl-enter",
      "round-challenge-shell--answers-prep"
    );
    shell?.classList.add("round-challenge-shell--awaiting-track");
    const cover = document.getElementById("album-cover");
    cover?.classList.remove("album-cover--load-spin", "album-cover--playing");
    document
      .getElementById("music-stage-cluster")
      ?.classList.remove("music-stage__cluster--round-enter");

    this.updateQuestion("", "");
    this.answerButtons.forEach((btn) => {
      btn.classList.remove(
        "correct",
        "wrong",
        "selected",
        "timeout-correct",
        "answer-btn--round-enter"
      );
      btn.style.removeProperty("--answer-enter-delay");
      btn.textContent = "";
      btn.dataset.answer = "";
      btn.classList.add("hidden");
      btn.disabled = true;
      btn.setAttribute("aria-hidden", "true");
      btn.querySelector(".answer-owner-badge")?.remove();
    });
  }

  /**
   * Parça fetch ile paralel: önce plak + süre çubuğu animasyonu, plak hemen dönmeye başlar.
   * Şıklar henüz yok; `setAnswerOptions` + `answers-prep` sonrası `revealRoundAnswersStagger` kullan.
   */
  beginRoundVinylPhase() {
    this._vinylPhaseStartMs = performance.now();
    const shell = document.getElementById("round-challenge-shell");
    const cover = document.getElementById("album-cover");
    if (!shell) return;

    if (this._vinylStripTimer != null) {
      clearTimeout(this._vinylStripTimer);
      this._vinylStripTimer = undefined;
    }

    shell.classList.remove(
      "round-challenge-shell--vinyl-enter",
      "round-challenge-shell--answers-prep"
    );
    const cluster = document.getElementById("music-stage-cluster");
    /* Plak + süre çubuğu tek cluster girişi; awaiting varken paused. disc-spin tur boyunca kalır. */
    cover?.classList.remove("album-cover--audio-paused");
    cluster?.classList.add("music-stage__cluster--round-enter");
    void cluster?.offsetWidth;
    shell.classList.remove("round-challenge-shell--awaiting-track");
    cover?.classList.add("album-cover--disc-spin");

    this._vinylStripTimer = window.setTimeout(() => {
      this._vinylStripTimer = undefined;
      cluster?.classList.remove("music-stage__cluster--round-enter");
    }, UIManager.VINYL_INTRO_MS);
  }

  /** Vinil fazının başından beri geçen süre (şık gecikmesi hesabı için). */
  getMsSinceRoundVinylStart() {
    if (this._vinylPhaseStartMs == null) return UIManager.VINYL_INTRO_MS;
    return performance.now() - this._vinylPhaseStartMs;
  }

  /** Vinil girişi bittikten sonra: şıklar yukarıdan aşağı (DOM sırası) teker teker. */
  revealRoundAnswersStagger() {
    const shell = document.getElementById("round-challenge-shell");
    if (!shell) return;

    shell.classList.remove("round-challenge-shell--answers-prep");
    void shell.offsetWidth;

    const visible = [...this.answerButtons].filter((b) => !b.classList.contains("hidden"));
    const staggerMs = 72;
    visible.forEach((btn, i) => {
      btn.style.setProperty("--answer-enter-delay", `${i * staggerMs}ms`);
      btn.classList.add("answer-btn--round-enter");
    });

    if (this._roundRevealStripTimer != null) {
      clearTimeout(this._roundRevealStripTimer);
    }
    const stripAfterMs = Math.max(420, visible.length * staggerMs + 500);
    this._roundRevealStripTimer = window.setTimeout(() => {
      this._roundRevealStripTimer = undefined;
      visible.forEach((btn) => {
        btn.classList.remove("answer-btn--round-enter");
        btn.style.removeProperty("--answer-enter-delay");
      });
    }, stripAfterMs);
  }

  /** Hata veya iptal: bekleyen tur yüzeyi sınıflarını sıfırla. */
  abortRoundSurfaceLoadingState() {
    if (this._roundRevealStripTimer != null) {
      clearTimeout(this._roundRevealStripTimer);
      this._roundRevealStripTimer = undefined;
    }
    if (this._vinylStripTimer != null) {
      clearTimeout(this._vinylStripTimer);
      this._vinylStripTimer = undefined;
    }
    this._vinylPhaseStartMs = undefined;
    const shell = document.getElementById("round-challenge-shell");
    shell?.classList.remove(
      "round-challenge-shell--awaiting-track",
      "round-challenge-shell--reveal-play-surface",
      "round-challenge-shell--vinyl-enter",
      "round-challenge-shell--answers-prep"
    );
    document
      .getElementById("album-cover")
      ?.classList.remove(
        "album-cover--load-spin",
        "album-cover--playing",
        "album-cover--disc-spin",
        "album-cover--audio-paused"
      );
    document
      .getElementById("music-stage-cluster")
      ?.classList.remove("music-stage__cluster--round-enter");
    this.answerButtons.forEach((btn) => {
      btn.classList.remove("answer-btn--round-enter");
      btn.style.removeProperty("--answer-enter-delay");
    });
  }

  // Reset answer buttons
  resetButtons() {
    this.answerButtons.forEach((btn) => {
      btn.classList.remove("correct", "wrong", "selected", "timeout-correct", "hidden");
      btn.disabled = false;
      btn.querySelector(".answer-owner-badge")?.remove();
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
    const expiredMsg = document.getElementById("timer-expired-msg");
    if (expiredMsg) {
      expiredMsg.textContent = "";
      expiredMsg.classList.add("hidden");
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
  updateRoundInfo(currentRound, totalRounds, isUnlimited = false, checkpointInterval = 10) {
    const roundInfo = document.getElementById("round-info");
    if (!roundInfo) return;
    const lang = getLang();
    if (isUnlimited) {
      const k = checkpointInterval - ((currentRound - 1) % checkpointInterval);
      roundInfo.textContent = tVar(
        "gamePage.roundInfoUnlimited",
        { n: String(currentRound), k: String(k) },
        lang
      );
    } else {
      roundInfo.textContent = tVar(
        "gamePage.roundInfoFixed",
        { n: String(currentRound), total: String(totalRounds) },
        lang
      );
    }
  }

  /** Brief highlight when Marathon checkpoint grants +1 life */
  flashMarathonCheckpoint() {
    const el = document.getElementById("lives-display");
    if (!el) return;
    el.classList.remove("lives-chip--checkpoint");
    void el.offsetWidth;
    el.classList.add("lives-chip--checkpoint");
    window.setTimeout(() => el.classList.remove("lives-chip--checkpoint"), 1000);
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
      const v = options[i];
      if (v != null && String(v).length > 0) {
        btn.textContent = v;
        btn.dataset.answer = v;
        btn.classList.remove("hidden");
        btn.disabled = false;
        btn.removeAttribute("aria-hidden");
      } else {
        btn.textContent = "";
        btn.dataset.answer = "";
        btn.classList.add("hidden");
        btn.disabled = true;
        btn.setAttribute("aria-hidden", "true");
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
    this.attachAnswerOwnerBadge(selectedButton);

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

  attachAnswerOwnerBadge(button) {
    this.answerButtons.forEach((btn) => {
      btn.querySelector(".answer-owner-badge")?.remove();
    });

    const currentAvatar =
      document.getElementById("player-avatar")?.getAttribute("src") ||
      avatarImgSrcFromRoot(DEFAULT_AVATAR_ID);

    const badge = document.createElement("span");
    badge.className = "answer-owner-badge";
    badge.innerHTML = `<img src="${currentAvatar}" alt="" class="answer-owner-badge__img">`;
    button.appendChild(badge);
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
    const deezerListenBtn = document.getElementById("deezer-listen-btn");
    const favBtn = document.getElementById("track-fav-btn");

    // Display album cover and song info
    if (track) {
      albumCoverDisplay.src = track.album?.cover_medium || COVER_FALLBACK;
      const displayTitle = track.cleanTitle || this.cleanSongTitle(track.title);
      songInfo.textContent = `${displayTitle} by ${track.artist}`;
    }

    // Deezer CTA (opens the track in a new tab)
    if (deezerListenBtn) {
      const deezerTrackId = track?.id;
      if (deezerTrackId) {
        deezerListenBtn.href = `https://www.deezer.com/track/${encodeURIComponent(String(deezerTrackId))}`;
        deezerListenBtn.classList.remove("hidden");
      } else {
        deezerListenBtn.classList.add("hidden");
      }
    }

    if (favBtn) {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      const isLoggedIn = Boolean(token);
      const hasTrackData = Boolean(track?.title && track?.artist);

      const trackKey = getFavoriteTrackKey(track);
      const favorites = readFavoriteTracks();
      const isFav = favorites.some((item) => item.key === trackKey);

      if (hasTrackData) {
        favBtn.classList.remove("hidden");
        favBtn.classList.toggle("is-active", isFav);
        favBtn.classList.toggle("is-disabled", !isLoggedIn);
        favBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
        favBtn.setAttribute(
          "title",
          !isLoggedIn
            ? "Log in to favorite songs"
            : isFav
              ? "Remove from favorites"
              : "Add to favorites"
        );
      } else {
        favBtn.classList.add("hidden");
      }

      favBtn.onclick = () => {
        const authToken = localStorage.getItem("token") || localStorage.getItem("auth_token");
        if (!authToken) {
          this.openFavAuthModal();
          return;
        }
        if (!track?.title || !track?.artist) return;

        const current = readFavoriteTracks();
        const currentKey = getFavoriteTrackKey(track);
        const idx = current.findIndex((item) => item.key === currentKey);
        let next = current;
        let nowFav = false;

        if (idx >= 0) {
          next = [...current.slice(0, idx), ...current.slice(idx + 1)];
          nowFav = false;
        } else {
          const favoriteEntry = {
            key: currentKey,
            id: track.id ?? null,
            title: track.cleanTitle || this.cleanSongTitle(track.title) || track.title,
            artist: track.artist,
            addedAt: Date.now(),
          };
          next = [favoriteEntry, ...current].slice(0, 100);
          nowFav = true;
        }

        writeFavoriteTracks(next);
        favBtn.classList.toggle("is-active", nowFav);
        favBtn.classList.remove("is-disabled");
        favBtn.setAttribute("aria-pressed", nowFav ? "true" : "false");
        favBtn.setAttribute("title", nowFav ? "Remove from favorites" : "Add to favorites");
        if (nowFav) {
          this.showFavTopToast("Added to favorites");
        }
      };
    }

    // Set result message based on last answer
    const selectedAnswer = document.querySelector(".answer-btn.selected");
    const lastAnswerCorrect = selectedAnswer?.classList.contains("correct");
    const timeoutOccurred = document.querySelector(".timeout-correct") !== null;

    const lang = getLang();
    if (!selectedAnswer && timeoutOccurred) {
      roundResult.textContent = t("gamePage.roundTimeUp", lang);
      roundMessage.textContent = t(roundCompletionDetailKeyTimeout(scoreData), lang);
      roundResult.className = "text-4xl font-bold text-red-400";
    } else if (lastAnswerCorrect) {
      roundResult.textContent = t("gamePage.roundCorrect", lang);
      roundMessage.textContent = t(roundCompletionDetailKeyCorrect(scoreData), lang);
      roundResult.className = "text-4xl font-bold text-yellow-400";
    } else if (selectedAnswer) {
      roundResult.textContent = t("gamePage.roundWrong", lang);
      roundMessage.textContent = t(roundCompletionDetailKeyWrong(scoreData), lang);
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
      nextRoundBtn.textContent = t("gamePage.roundSeeFinal", lang);
      if (scoreData.gameMode === "solo") {
        roundResult.textContent = t("gamePage.roundGameOver", lang);
        roundMessage.textContent = t("gamePage.roundOutOfLives", lang);
        roundResult.className = "text-4xl font-bold text-red-400";
      }
    } else {
      nextRoundBtn.textContent = t("gamePage.roundNext", lang);
    }

    if (
      !isGameOver &&
      scoreData.marathonCheckpointBonus &&
      (scoreData.gameMode === "solo" || scoreData.gameMode === "marathon")
    ) {
      const bonus = t("gamePage.marathonCheckpointLife", lang);
      roundMessage.textContent = roundMessage.textContent
        ? `${roundMessage.textContent} · ${bonus}`
        : bonus;
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

  showFavTopToast(message) {
    const el = document.getElementById("fav-toast");
    if (!el) return;
    el.textContent = message;
    el.setAttribute("aria-hidden", "false");
    window.clearTimeout(this.favToastTimer);
    window.clearTimeout(this.favToastHideTimer);
    el.classList.add("fav-toast--show");
    this.favToastTimer = window.setTimeout(() => {
      el.classList.remove("fav-toast--show");
      this.favToastHideTimer = window.setTimeout(() => {
        el.textContent = "";
        el.setAttribute("aria-hidden", "true");
      }, 400);
    }, 2400);
  }

  openFavAuthModal() {
    const modal = document.getElementById("fav-auth-modal");
    const loginBtn = document.getElementById("fav-auth-login-btn");
    const closeBtn = document.getElementById("fav-auth-close-btn");
    if (!modal || !loginBtn || !closeBtn) return;

    const closeModal = () => {
      modal.classList.add("hidden");
      modal.classList.remove("show-modal");
    };

    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("show-modal"), 10);

    loginBtn.onclick = () => {
      localStorage.setItem("riffle_open_login_on_home", "1");
      window.location.href = "./index.html";
    };
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  // Update score table in round completion screen
  updateScoreTable(scoreTable, scoreData, lastAnswerCorrect, timedOut) {
    scoreTable.innerHTML = "";

    if (scoreData.gameMode === "solo" || scoreData.gameMode === "marathon") {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="py-2">
          <div class="flex items-center justify-center gap-2">
            <div class="standings-avatar-wrap">
              <img src="${avatarImgSrcFromRoot(normalizeAvatarId(scoreData.avatar || DEFAULT_AVATAR_ID))}" alt="">
            </div>
            <span class="font-semibold text-white">You</span>
          </div>
        </td>
        <td class="py-2 text-center font-bold">${scoreData.score}</td>
        <td class="py-2 text-center font-semibold">
          ${
            lastAnswerCorrect
              ? `+${scoreData.lastRoundPoints ?? 0} pts`
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
        <td colspan="3" class="py-2">
          <div class="flex items-center justify-between gap-3 rounded-lg bg-gray-900/45 px-3 py-2">
            <div class="text-sm text-purple-200">
              <span class="text-gray-400 mr-1">Streak:</span>
              <span class="font-semibold text-white">${
                lastAnswerCorrect
                  ? scoreData.rounds > 1
                    ? "Continues!"
                    : "Started!"
                  : timedOut
                    ? "Timed Out!"
                    : "Broken!"
              }</span>
            </div>
            <span class="inline-flex items-center bg-gray-800 rounded-full px-3 py-1 text-sm shrink-0">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"></path>
            </svg>
            ${scoreData.remainingLives}
            </span>
          </div>
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

    // Show final score (total points + correct / rounds)
    finalScore.textContent = `${scoreData.score} pts`;
    const finalDetail = document.getElementById("final-score-detail");
    if (finalDetail) {
      const rounds = scoreData.rounds ?? 0;
      const correct = scoreData.correctCount ?? 0;
      finalDetail.textContent =
        rounds > 0
          ? `${correct} correct out of ${rounds} ${rounds === 1 ? "round" : "rounds"}`
          : "";
    }

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
    const openLeaderboardBtn = document.getElementById("open-final-leaderboard");
    const leaderboardPopup = document.getElementById("final-leaderboard-popup");
    const closeLeaderboardBtn = document.getElementById("close-final-leaderboard");

    if (leaderboardPopup) {
      leaderboardPopup.classList.add("hidden");
      leaderboardPopup.classList.remove("show-modal");
      leaderboardPopup.onclick = (e) => {
        if (e.target === leaderboardPopup) {
          leaderboardPopup.classList.add("hidden");
          leaderboardPopup.classList.remove("show-modal");
        }
      };
    }

    if (openLeaderboardBtn && leaderboardPopup) {
      openLeaderboardBtn.onclick = () => {
        leaderboardPopup.classList.remove("hidden");
        setTimeout(() => leaderboardPopup.classList.add("show-modal"), 10);
      };
    }

    if (closeLeaderboardBtn && leaderboardPopup) {
      closeLeaderboardBtn.onclick = () => {
        leaderboardPopup.classList.add("hidden");
        leaderboardPopup.classList.remove("show-modal");
      };
    }

    const guestCta = document.getElementById("guest-save-cta");
    if (guestCta) {
      if (!localStorage.getItem("token")) {
        guestCta.innerHTML =
          '<p class="text-sm text-purple-200">Save your progress and climb the leaderboards — <a href="./index.html" class="text-purple-400 font-semibold underline hover:text-purple-300">create an account</a>.</p>';
        guestCta.classList.remove("hidden");
      } else {
        guestCta.classList.add("hidden");
        guestCta.innerHTML = "";
      }
    }

    submitScoreIfLoggedIn(scoreData);

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

    // Load & render top leaderboard podium for this game mode.
    // Do not block UI; it updates when API returns.
    this.loadFinalModeLeaderboard(scoreData.gameMode);
  }

  // Update game statistics display
  updateGameStats(gameStats, scoreData) {
    const statsAv = normalizeAvatarId(scoreData.avatar || DEFAULT_AVATAR_ID);
    const statsAvatarRow = `
      <div class="game-stats-player" aria-hidden="true">
        <div class="game-stats-player__ring">
          <img class="game-stats-player__img" src="${avatarImgSrcFromRoot(statsAv)}" alt="">
        </div>
      </div>
    `;
    const correct = scoreData.correctCount ?? 0;
    const rounds = scoreData.rounds ?? 0;
    let statsHTML = `${statsAvatarRow}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.1s">
          <p class="text-gray-400 text-sm">Total points</p>
          <p class="text-2xl font-bold">${scoreData.score}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.2s">
          <p class="text-gray-400 text-sm">Correct</p>
          <p class="text-2xl font-bold">${correct} / ${rounds}</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.3s">
          <p class="text-gray-400 text-sm">Accuracy</p>
          <p class="text-2xl font-bold">${scoreData.accuracy}%</p>
        </div>`;

    if (scoreData.gameMode === "solo" && scoreData.totalLives !== undefined) {
      statsHTML += `
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.4s">
          <p class="text-gray-400 text-sm">Lives Left</p>
          <p class="text-2xl font-bold">${scoreData.remainingLives}</p>
        </div>`;
    } else {
      statsHTML += `
        <div class="bg-gray-800 rounded-lg p-4 text-center animate-fadeInUp" style="animation-delay: 0.4s">
          <p class="text-gray-400 text-sm">Avg Response</p>
          <p class="text-2xl font-bold">${scoreData.averageResponseTime.toFixed(1)}s</p>
        </div>`;
    }

    statsHTML += `
      </div>
      <p class="text-center text-sm text-purple-300/90 mb-2">${scoreData.gameMode.charAt(0).toUpperCase() + scoreData.gameMode.slice(1)} mode</p>
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
          <div class="flex items-center gap-3">
            <div class="standings-avatar-wrap">
              <img src="${avatarImgSrcFromRoot(normalizeAvatarId(scoreData.avatar || DEFAULT_AVATAR_ID))}" alt="">
            </div>
            <div class="flex items-center">
              <span class="text-yellow-400 mr-2">👑</span>
              You
            </div>
          </div>
        </td>
        <td class="py-3 text-center text-purple-400">${scoreData.score}</td>
        <td class="py-3 text-right">
          <span class="inline-block bg-gray-800 rounded-full px-2 py-1 text-sm">
            ${scoreData.correctCount ?? 0} / ${scoreData.rounds ?? 0}
            <span class="text-gray-400"> (${scoreData.accuracy}%)</span>
          </span>
        </td>
      `;
      scoreTableBody.appendChild(row);
    } else if (scoreData.players) {
      // Multiplayer mode
      const sortedPlayers = [...scoreData.players].sort((a, b) => b.score - a.score);

      const roundsPlayed = scoreData.rounds ?? scoreData.totalRounds ?? 0;

      sortedPlayers.forEach((player, i) => {
        const correctN = player.correctCount ?? 0;
        const accuracy = roundsPlayed > 0 ? Math.round((correctN / roundsPlayed) * 100) : 0;

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
              <div class="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-${player.color} to-indigo-600 p-0.5 mr-2">
                <img src="${avatarImgSrcFromRoot(normalizeAvatarId(player.avatar || DEFAULT_AVATAR_ID))}" alt="${player.name}'s Avatar" class="h-full w-full rounded-full object-cover">
              </div>
              ${player.name}
            </div>
          </td>
          <td class="py-3 text-center text-${player.color}-400">${player.score}</td>
          <td class="py-3 text-right">
            <span class="inline-block bg-gray-800 rounded-full px-2 py-1 text-sm">
              ${correctN} / ${roundsPlayed}
              <span class="text-gray-400"> (${accuracy}%)</span>
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
  setupGameMode(gameMode, _settings, players) {
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
            <img src="${avatarImgSrcFromRoot(normalizeAvatarId(player.avatar || DEFAULT_AVATAR_ID))}" alt="${player.name}'s Avatar" class="rounded-full">
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
