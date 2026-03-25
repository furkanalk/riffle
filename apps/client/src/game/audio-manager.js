// audio-manager.js
export class AudioManager {
  constructor() {
    this.musicPlayer = document.getElementById("music-player");
    this.musicProgressTimer = null;
    this.audioAnimationFrameId = null;
    this.currentTrack = null;
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
    this.musicPlayer.volume = 0.8;
  }

  // Play music preview with enhanced effects
  async playMusic() {
    const albumCover = document.querySelector(".album-cover");
    if (albumCover) {
      albumCover.style.transition = "all 0.5s ease-in-out";
      albumCover.style.transform = "scale(1.05)";
      albumCover.style.boxShadow = "0 0 20px rgba(139, 92, 246, 0.7)";

      setTimeout(() => {
        albumCover.style.transform = "scale(1)";
        albumCover.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.5)";
      }, 500);
    }

    await this.attemptAutoplay();
    this.startMusicDurationBar();
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

  // Reset music player
  resetMusicPlayer() {
    this.musicPlayer.pause();
    this.musicPlayer.currentTime = 0;

    const musicProgress = document.getElementById("music-progress");
    if (musicProgress) {
      musicProgress.style.width = "100%";
    }

    if (this.musicProgressTimer) {
      clearInterval(this.musicProgressTimer);
      this.musicProgressTimer = null;
    }

    this.stopMusicVisualizer();
  }

  // Start music duration bar
  startMusicDurationBar() {
    const musicProgress = document.getElementById("music-progress");
    musicProgress.style.width = "100%";

    const musicDuration = 10; // Default 10 seconds
    let timeElapsed = 0;

    if (this.musicProgressTimer) {
      clearInterval(this.musicProgressTimer);
    }

    this.musicProgressTimer = setInterval(() => {
      if (!this.musicPlayer.paused) {
        timeElapsed += 0.1;
        const percentage = 100 - (timeElapsed / musicDuration) * 100;

        if (musicProgress) {
          musicProgress.style.width = `${percentage}%`;
        }

        if (timeElapsed >= musicDuration) {
          clearInterval(this.musicProgressTimer);
          if (musicProgress) {
            musicProgress.style.width = "100%";
          }
        }
      }
    }, 100);

    return this.musicProgressTimer;
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
