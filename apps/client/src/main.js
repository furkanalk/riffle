import "./css/main-menu-responsive.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";
import { initLanguageControl } from "./core/i18n.js";

document.addEventListener("DOMContentLoaded", () => {
  initLanguageControl();
  initAuthUI();
  initLeaderboard();
});

console.log("Riffle Client is starting...");
