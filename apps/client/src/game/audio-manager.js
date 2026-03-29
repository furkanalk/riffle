// audio-manager.js

import { getMusicPreviewVolume } from "../core/app-preferences.js";

export class AudioManager {
  constructor() {
    this.musicPlayer = document.getElementById("music-player");
    /** @type {number | null} requestAnimationFrame id for preview bar */
    this._previewRafId = null;
    this.audioAnimationFrameId = null;
    this.currentTrack = null;
    /** Last answer-window length (s); reused when resuming playback without an argument. */
    this._previewWindowSec = 10;
    this._onMusicVolumeChanged = () => {
      if (this.musicPlayer) this.musicPlayer.volume = getMusicPreviewVolume();
    };
    window.addEventListener("riffle-music-volume-changed", this._onMusicVolumeChanged);

    if (this.musicPlayer) {
      this.musicPlayer.addEventListener("play", () => {
        document.getElementById("album-cover")?.classList.remove("album-cover--audio-paused");
      });
      this.musicPlayer.addEventListener("pause", () => {
        document.getElementById("album-cover")?.classList.add("album-cover--audio-paused");
      });
    }
  }

  // Initialize audio API in the browser before use
  async initializeAudio() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const silentBuffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      return audioContext;
    } catch (_e) {
      return null;
    }
  }

  // Set current track
  setCurrentTrack(track) {
    this.currentTrack = track;
    if (!track?.preview) {
      console.warn("[AudioManager] Track has no preview URL — skipping audio load", track?.title);
      this.musicPlayer.removeAttribute("src");
      this.musicPlayer.load();
      return;
    }
    this.musicPlayer.src = track.preview;
    this.musicPlayer.volume = getMusicPreviewVolume();
  }

  /** @param {number} [previewWindowSec] Answer-window seconds; falls back to last round. */
  async playMusic(previewWindowSec) {
    if (typeof previewWindowSec === "number" && previewWindowSec > 0) {
      this._previewWindowSec = previewWindowSec;
    }

    await this.attemptAutoplay();
    this.startMusicDurationBar(this._previewWindowSec);
    this.startMusicVisualizer();
  }

  // Attempt to play audio with autoplay handling
  async attemptAutoplay() {
    if (!this.musicPlayer.src || this.musicPlayer.src === window.location.href) {
      console.warn("[AudioManager] No audio source — skipping playback");
      return;
    }

    try {
      this.musicPlayer.muted = true;
      await this.musicPlayer.play();
      setTimeout(() => {
        this.musicPlayer.muted = false;
      }, 100);
    } catch (_e) {
      const handlePageInteraction = () => {
        this.musicPlayer.muted = false;
        this.musicPlayer.play().catch(() => {
          // User interaction happened but source still unusable — ignore silently
        });
        document.removeEventListener("click", handlePageInteraction);
        document.removeEventListener("keydown", handlePageInteraction);
      };

      document.addEventListener("click", handlePageInteraction);
      document.addEventListener("keydown", handlePageInteraction);
    }
  }

  // Toggle play/pause
  togglePlayPause() {
    if (this.musicPlayer.paused) {
      this.playMusic();
    } else {
      this.musicPlayer.pause();
      this.stopMusicVisualizer();
    }
  }

  // Pause music
  pauseMusic() {
    this.musicPlayer.pause();
    this.stopMusicVisualizer();
  }

  _setPreviewTimerUi(remainingSec, fillRatio) {
    const fill = document.getElementById("music-preview-progress");
    const track = document.getElementById("music-preview-track");
    const pct = Math.max(0, Math.min(100, fillRatio * 100));

    if (fill) {
      fill.style.width = `${pct}%`;
    }
    if (track) {
      track.setAttribute("aria-valuenow", String(Math.round(pct)));
      track.setAttribute(
        "aria-valuetext",
        `${Math.max(0, Math.ceil(remainingSec))} seconds remaining`
      );
    }
  }

  // Reset music player
  resetMusicPlayer() {
    this.musicPlayer.pause();
    this.musicPlayer.currentTime = 0;

    this._setPreviewTimerUi(this._previewWindowSec, 1);

    if (this._previewRafId != null) {
      cancelAnimationFrame(this._previewRafId);
      this._previewRafId = null;
    }

    this.stopMusicVisualizer();
  }

  // Preview countdown bar (synced to answer window; rAF avoids 100ms stepping)
  startMusicDurationBar(musicDurationSec) {
    const fill = document.getElementById("music-preview-progress");
    if (!fill) return null;

    const dur = Math.max(0.5, Number(musicDurationSec) || this._previewWindowSec);

    if (this._previewRafId != null) {
      cancelAnimationFrame(this._previewRafId);
      this._previewRafId = null;
    }

    let timeElapsed = 0;
    let lastTs = performance.now();
    this._setPreviewTimerUi(dur, 1);

    const tick = (now) => {
      if (!this.musicPlayer.paused) {
        timeElapsed += (now - lastTs) / 1000;
        timeElapsed = Math.min(timeElapsed, dur);
      }
      lastTs = now;

      const remaining = Math.max(0, dur - timeElapsed);
      const ratio = remaining / dur;
      this._setPreviewTimerUi(remaining, ratio);

      if (remaining <= 0) {
        this._previewRafId = null;
        this._setPreviewTimerUi(0, 0);
        return;
      }
      this._previewRafId = requestAnimationFrame(tick);
    };

    this._previewRafId = requestAnimationFrame(tick);
    return this._previewRafId;
  }

  // Create music visualizer
  createMusicVisualizer() {
    const container = document.getElementById("music-visualizer");
    if (!container) return;

    let barsContainer = container.querySelector(".audio-bars-container");
    if (!barsContainer) {
      barsContainer = document.createElement("div");
      barsContainer.className = "audio-bars-container flex items-center justify-center space-x-1";
      container.appendChild(barsContainer);
    }

    barsContainer.innerHTML = "";

    const barCount = 7;

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "audio-bar";
      barsContainer.appendChild(bar);
    }
  }

  // Start music visualizer animation
  startMusicVisualizer() {
    const bars = document.querySelectorAll(".audio-bar");
    if (!bars.length) return;

    bars.forEach((bar, index) => {
      bar.classList.add("active");
      bar.style.animationDelay = `${index * 0.1}s`;
    });

    if (this.audioAnimationFrameId) {
      cancelAnimationFrame(this.audioAnimationFrameId);
    }

    const animateBars = () => {
      if (this.musicPlayer.paused) return;

      bars.forEach((bar) => {
        if (Math.random() > 0.5) {
          const height = Math.random() * 10 + 5;
          bar.style.height = `${height}px`;
        }
      });

      this.audioAnimationFrameId = requestAnimationFrame(animateBars);
    };

    this.audioAnimationFrameId = requestAnimationFrame(animateBars);
  }

  // Stop music visualizer animation
  stopMusicVisualizer() {
    if (this.audioAnimationFrameId) {
      cancelAnimationFrame(this.audioAnimationFrameId);
    }

    const bars = document.querySelectorAll(".audio-bar");
    if (!bars.length) return;

    bars.forEach((bar) => {
      bar.classList.remove("active");
      bar.style.animation = "";
      bar.style.height = "5px";
    });
  }

  // Setup page interaction handlers for autoplay
  setupPageInteractionHandlers() {
    const pageInteractionHandler = () => {
      if (this.musicPlayer.paused && this.musicPlayer.src) {
        this.musicPlayer.muted = false;
        this.musicPlayer.play().catch((_e) => {
          /* Autoplay attempt error handled silently */
        });
      }

      document.removeEventListener("click", pageInteractionHandler);
      document.removeEventListener("touchstart", pageInteractionHandler);
      document.removeEventListener("keydown", pageInteractionHandler);
    };

    document.addEventListener("click", pageInteractionHandler);
    document.addEventListener("touchstart", pageInteractionHandler);
    document.addEventListener("keydown", pageInteractionHandler);
  }
}
