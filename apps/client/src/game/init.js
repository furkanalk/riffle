import "../css/ambient-effects.css";
import "../css/app-preferences.css";
import { initAmbientEffects } from "../core/ambient-effects.js";
import { applyAppPreferenceClasses } from "../core/app-preferences.js";
import { GameEngine } from "./game-engine.js";

document.addEventListener("DOMContentLoaded", async () => {
  applyAppPreferenceClasses();
  initAmbientEffects();
  const game = new GameEngine();
  await game.initialize();
});
