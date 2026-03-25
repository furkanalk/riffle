import { gameMode } from "./state.js";

/** Marathon = solo run: no lobby tabs, invite still uses real URL for future deep links. */
export function applyModeLayout() {
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get("mode") || "";

  document.body.classList.toggle("mode-marathon-solo", gameMode === "solo" || rawMode === "marathon");

  const invite = document.getElementById("invite-link");
  if (invite) {
    invite.value = window.location.href;
  }
}
