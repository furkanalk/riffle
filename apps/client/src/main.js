import "./css/main-menu-responsive.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";
import { initLanguageControl } from "./core/i18n.js";
import { initMainLeaderboardPreview } from "./menu/leaderboard-preview-ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initLanguageControl();
  initAuthUI();
  initLeaderboard();
  initMainLeaderboardPreview();
});

console.log("Riffle Client is starting...");
