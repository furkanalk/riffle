import "../css/ambient-effects.css";
import "../css/app-preferences.css";
import { initAmbientEffects } from "../core/ambient-effects.js";
import { applyAppPreferenceClasses } from "../core/app-preferences.js";
import { applyGamePageLanguage, getLang } from "../core/i18n.js";
import { GameEngine } from "./game-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  applyAppPreferenceClasses();
  applyGamePageLanguage(getLang());
  initAmbientEffects();
  const game = new GameEngine();
  await game.initialize();
});

document.addEventListener("riffle-lang-changed", () => {
  applyGamePageLanguage(getLang());
});
