const STORAGE_VOLUME = "riffle_music_preview_volume";
const STORAGE_REDUCED_MOTION = "riffle_reduced_motion";
const STORAGE_LARGE_TAP = "riffle_large_tap";

export function getMusicPreviewVolume() {
  try {
    const v = localStorage.getItem(STORAGE_VOLUME);
    if (v == null) return 0.8;
    const n = Number(v);
    if (Number.isNaN(n)) return 0.8;
    return Math.min(1, Math.max(0, n / 100));
  } catch {
    return 0.8;
  }
}

function getVolumePercentStored() {
  return Math.round(getMusicPreviewVolume() * 100);
}

function setVolumePercent(p) {
  const n = Math.min(100, Math.max(0, Math.round(Number(p) || 0)));
  try {
    localStorage.setItem(STORAGE_VOLUME, String(n));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("riffle-music-volume-changed"));
}

export function applyAppPreferenceClasses() {
  const root = document.documentElement;
  try {
    root.classList.toggle("riffle-reduced-motion", localStorage.getItem(STORAGE_REDUCED_MOTION) === "1");
    root.classList.toggle("riffle-large-tap", localStorage.getItem(STORAGE_LARGE_TAP) === "1");
  } catch {
    /* ignore */
  }
}

function setReducedMotion(on) {
  try {
    if (on) localStorage.setItem(STORAGE_REDUCED_MOTION, "1");
    else localStorage.removeItem(STORAGE_REDUCED_MOTION);
  } catch {
    /* ignore */
  }
  applyAppPreferenceClasses();
}

function setLargeTap(on) {
  try {
    if (on) localStorage.setItem(STORAGE_LARGE_TAP, "1");
    else localStorage.removeItem(STORAGE_LARGE_TAP);
  } catch {
    /* ignore */
  }
  applyAppPreferenceClasses();
}

function refreshPrefsForm() {
  const vol = document.getElementById("app-prefs-music-volume");
  const volValue = document.getElementById("app-prefs-music-volume-value");
  const reduced = document.getElementById("app-prefs-reduced-motion");
  const largeTap = document.getElementById("app-prefs-large-tap");
  if (vol) vol.value = String(getVolumePercentStored());
  if (volValue && vol) volValue.textContent = `${vol.value}%`;
  if (reduced) reduced.checked = localStorage.getItem(STORAGE_REDUCED_MOTION) === "1";
  if (largeTap) largeTap.checked = localStorage.getItem(STORAGE_LARGE_TAP) === "1";
}

function openPanel() {
  const panel = document.getElementById("app-preferences-panel");
  if (!panel) return;
  refreshPrefsForm();
  panel.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function closePanel() {
  const panel = document.getElementById("app-preferences-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

export function initAppPreferencesPanel() {
  const panel = document.getElementById("app-preferences-panel");
  const closeBtn = document.getElementById("close-app-preferences");
  const vol = document.getElementById("app-prefs-music-volume");
  const volValue = document.getElementById("app-prefs-music-volume-value");
  const reduced = document.getElementById("app-prefs-reduced-motion");
  const largeTap = document.getElementById("app-prefs-large-tap");
  const settingsCard = document.getElementById("menu-settings-btn");

  if (!panel) return;

  vol?.addEventListener("input", () => {
    setVolumePercent(vol.value);
    if (volValue) volValue.textContent = `${vol.value}%`;
  });

  reduced?.addEventListener("change", () => setReducedMotion(Boolean(reduced.checked)));

  largeTap?.addEventListener("change", () => setLargeTap(Boolean(largeTap.checked)));

  settingsCard?.addEventListener("click", () => {
    openPanel();
  });

  closeBtn?.addEventListener("click", closePanel);
  panel.addEventListener("click", (e) => {
    if (e.target === panel) closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (panel.classList.contains("hidden")) return;
    closePanel();
  });

  refreshPrefsForm();
}
