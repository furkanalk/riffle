import "./css/main-menu-responsive.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";
import { initLanguageControl } from "./core/i18n.js";
import { initMainLeaderboardPreview } from "./menu/leaderboard-preview-ui.js";

function initLearnMorePanel() {
  const openBtn = document.getElementById("learn-more-btn");
  const panel = document.getElementById("learn-more-panel");
  const closeBtn = document.getElementById("close-learn-more");
  const backBtn = document.getElementById("learn-more-back-home");

  if (!openBtn || !panel) return;

  const openPanel = () => {
    panel.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  };

  const closePanel = () => {
    panel.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  };

  openBtn.addEventListener("click", openPanel);
  closeBtn?.addEventListener("click", closePanel);
  backBtn?.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) closePanel();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguageControl();
  initAuthUI();
  initLeaderboard();
  initMainLeaderboardPreview();
  initLearnMorePanel();
});

console.log("Riffle Client is starting...");
