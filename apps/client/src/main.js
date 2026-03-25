import "./css/main-menu-responsive.css";
import { initAuthUI } from "./auth/auth-ui.js";
import { initLeaderboard } from "./menu/leaderboard-ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initAuthUI();
  initLeaderboard();
});

console.log("Riffle Client is starting...");
