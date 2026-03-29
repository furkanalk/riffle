import "./css/ambient-effects.css";
import "./css/main-menu-responsive.css";
import "./css/app-preferences.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initAmbientEffects } from "./core/ambient-effects.js";
import { applyAppPreferenceClasses, initAppPreferencesPanel } from "./core/app-preferences.js";
import { initLanguageControl } from "./core/i18n.js";
import { initMainLeaderboardPreview } from "./menu/leaderboard-preview-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";
import { tryConsumeOpenFriendsIntent } from "./social/social-friends-panel.js";
import { initSocialFeatures } from "./social/social-init.js";

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

document.addEventListener("DOMContentLoaded", () => {
  applyAppPreferenceClasses();
  initLanguageControl();
  initAuthUI();
  initAppPreferencesPanel();
  initSocialFeatures();
  tryConsumeOpenFriendsIntent();
  initLeaderboard();
  initMainLeaderboardPreview();
  const openLearnMorePanel = initLearnMorePanel();
  initMenuCards(openLearnMorePanel);
  initAmbientEffects();
});

console.log("Riffle Client is starting...");
