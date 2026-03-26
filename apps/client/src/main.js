import "./css/main-menu-responsive.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initLanguageControl } from "./core/i18n.js";
import { initMainLeaderboardPreview } from "./menu/leaderboard-preview-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";

function initLearnMorePanel() {
  const openBtn = document.getElementById("learn-more-btn");
  const panel = document.getElementById("learn-more-panel");
  const closeBtn = document.getElementById("close-learn-more");
  const backBtn = document.getElementById("learn-more-back-home");

  if (!panel) return () => {};

  const openPanel = () => {
    panel.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  };

  const closePanel = () => {
    panel.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  };

  openBtn?.addEventListener("click", openPanel);
  closeBtn?.addEventListener("click", closePanel);
  backBtn?.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) closePanel();
  });
  return openPanel;
}

function initMenuCards(openLearnMorePanel) {
  const playBtn = document.getElementById("menu-play-btn");
  const settingsBtn = document.getElementById("menu-settings-btn");
  const creditsBtn = document.getElementById("menu-credits-btn");
  const openPlayModePanel = document.getElementById("play-mode-panel");
  const closePlayModeBtn = document.getElementById("close-play-mode");
  const mobileNewsLearnMoreBtn = document.getElementById("mobile-news-learn-more-btn");
  const desktopAboutPanel = document.getElementById("desktop-about-panel");
  const closeDesktopAboutBtn = document.getElementById("close-desktop-about");

  const openPlayPanel = () => {
    openPlayModePanel?.classList.remove("hidden");
  };
  const closePlayPanel = () => {
    openPlayModePanel?.classList.add("hidden");
  };
  playBtn?.addEventListener("click", openPlayPanel);
  closePlayModeBtn?.addEventListener("click", closePlayPanel);
  openPlayModePanel?.addEventListener("click", (e) => {
    if (e.target === openPlayModePanel) closePlayPanel();
  });

  const profileBtn = document.getElementById("user-profile-btn");
  // Login button is handled inside auth-ui (mainly for guests).

  const openDesktopAbout = () => {
    if (!desktopAboutPanel) return;
    desktopAboutPanel.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  };

  const closeDesktopAbout = () => {
    if (!desktopAboutPanel) return;
    desktopAboutPanel.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  };

  closeDesktopAboutBtn?.addEventListener("click", closeDesktopAbout);
  desktopAboutPanel?.addEventListener("click", (e) => {
    if (e.target === desktopAboutPanel) closeDesktopAbout();
  });

  settingsBtn?.addEventListener("click", () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      // Settings card (mobile): let auth-ui open profile panel for guests (read-only).
      window.riffleOpenProfileFromSettings = true;
      profileBtn?.click();
      return;
    }
    // Desktop: always open profile panel (guest included).
    window.riffleOpenProfileFromSettings = true;
    profileBtn?.click();
  });

  creditsBtn?.addEventListener("click", () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isMobile) {
      openLearnMorePanel?.();
      return;
    }
    openDesktopAbout();
  });

  mobileNewsLearnMoreBtn?.addEventListener("click", () => {
    openLearnMorePanel?.();
  });
}

function initMouseNotes() {
  if (window.matchMedia("(max-width: 640px)").matches) return;
  const layer = document.getElementById("note-particles");
  if (!layer) return;
  let last = 0;
  const glyphs = ["♪", "♫", "♬", "♩"];
  document.addEventListener("pointermove", (e) => {
    const now = Date.now();
    if (now - last < 75) return;
    last = now;
    const note = document.createElement("span");
    note.className = "note-particle";
    note.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    note.style.left = `${e.clientX}px`;
    note.style.top = `${e.clientY}px`;
    layer.appendChild(note);
    setTimeout(() => note.remove(), 900);
  });
}

function initLyricsBackground() {
  if (window.matchMedia("(max-width: 640px)").matches) return;
  const layer = document.getElementById("lyrics-bg");
  if (!layer) return;
  const lines = [
    "Echoes burning through the night",
    "Steel hearts beating out of time",
    "Voices rising from the flame",
    "Nothing here will stay the same",
    "Feel the rhythm in your veins",
    "Fire dancing in the rain",
    "Shadows calling out your name",
    "Break the silence, break the chain",
    "Midnight pulses through the air",
    "Wild energy everywhere",
    "Lost inside the endless sound",
    "Let the darkness pull you down",
    "Heavy echoes shake the ground",
    "Every beat is sacred now",
    "Run with thunder in your chest",
    "Never settle, never rest",
    "Crimson lights and shattered skies",
    "Truth is hidden in the noise",
    "Storms are forming deep within",
    "Let the chaos slowly begin",
    "Electric dreams begin to rise",
    "Lightning flashing in your eyes",
    "Sound of freedom fills the void",
    "Every fear will be destroyed",
    "Raging voices in the dark",
    "Every note ignites a spark",
    "Cold air cutting through your skin",
    "Let the revolution begin",
    "Feel the static in your soul",
    "Losing every bit control",
    "Burning brighter every second",
    "This is where the lost are beckoned",
    "Neon shadows start to crawl",
    "Hear the distant metal call",
    "Every heartbeat hits like war",
    "Always craving something more",
    "Broken silence starts to scream",
    "Waking up inside a dream",
    "Turn it louder, feel it grow",
    "Let the inner demons show",
    "Darkness bending to the sound",
    "In this chaos we are found",
    "Fading lines between the real",
    "Only noise is left to feel",
    "Rise again through ash and flame",
    "Nothing here can stay the same",
    "Feel the world begin to shake",
    "This is more than you can take",
    "Endless noise inside your head",
    "Waking what was left for dead",
    "Through the fire we remain",
    "Bound together by the flame",
  ];
  for (let i = 0; i < 8; i++) {
    const el = document.createElement("div");
    el.className = "lyrics-line";
    el.textContent = lines[Math.floor(Math.random() * lines.length)];
    el.style.top = `${8 + i * 11}%`;
    el.style.fontSize = `${0.72 + Math.random() * 0.42}rem`;
    el.style.animationDuration = `${18 + Math.random() * 20}s`;
    el.style.animationDelay = `${-Math.random() * 16}s`;
    layer.appendChild(el);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguageControl();
  initAuthUI();
  initLeaderboard();
  initMainLeaderboardPreview();
  const openLearnMorePanel = initLearnMorePanel();
  initMenuCards(openLearnMorePanel);
  initMouseNotes();
  initLyricsBackground();
});

console.log("Riffle Client is starting...");
