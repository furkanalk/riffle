import { getAllGenres } from "../core/music.js";
import { sendChatMessage } from "./category-chat.js";
import { filterCategories, toggleCategory } from "./category-filters.js"; // Importların doğru olduğundan emin ol
import { isQuickPlayMode } from "./quick-play.js";
import { gameMode, selectedCategories } from "./state.js";

// --- CONSTANTS ---

const MODE_LABELS = {
  solo: "Marathon",
  marathon: "Marathon",
  coop: "Cooperative",
  versus: "Versus",
  team: "Team",
  chaos: "Chaos",
  custom: "Custom",
};

const VISIBILITY_LABELS = {
  visible: "Answers Visible to All",
  hidden: "Answers Hidden Until Round End",
  individual: "Answers Only Visible to Answerer",
};

// --- HELPERS ---

const getEl = (id) => document.getElementById(id);

const setVisibility = (element, isVisible, options = {}) => {
  if (!element) return;

  if (!isVisible) {
    element.classList.add("hidden");
    element.style.display = "none";
    element.style.visibility = "hidden";
    element.style.opacity = "0";
    if (options.hideAsAbsolute) {
      element.style.position = "absolute";
      element.style.pointerEvents = "none";
    }
    return;
  }

  element.classList.remove("hidden");
  element.style.display = options.display || "block";
  element.style.visibility = "visible";
  element.style.opacity = "1";
  element.style.pointerEvents = "auto";
  if (options.position) element.style.position = options.position;
};

// --- CONFIGURATION LOGIC ---

function setupGameModeSettings() {
  const currentUrlMode = new URLSearchParams(window.location.search).get("mode");

  if (currentUrlMode && currentUrlMode !== gameMode && currentUrlMode !== "marathon") {
    console.warn(`URL mode '${currentUrlMode}' does not match internal game mode '${gameMode}'`);
  }

  const els = {
    answerVisibility: getEl("answer-visibility-container"),
    livesContainer: getEl("lives-container"),
    roundCount: getEl("round-count"),
    marathonDisplay: getEl("marathon-unlimited-display"),
    marathonBadge: getEl("marathon-badge"),
    marathonBadgeLives: getEl("marathon-badge-lives"),
  };

  const isMarathon = gameMode === "solo" || gameMode === "marathon";

  if (isMarathon) {
    configureMarathonMode(els);
    configureTeamSizeFields();
    configureQuickPlayLayout();
    loadSavedModeSettings();
    return;
  }

  configureNormalMode(els);
  configureTeamSizeFields();
  configureQuickPlayLayout();
  loadSavedModeSettings();
}

function configureTeamSizeFields() {
  const coopWrap = getEl("coop-team-size-container");
  const teamWrap = getEl("team-vs-size-container");
  const isCoop = gameMode === "coop";
  const isTeam = gameMode === "team";
  setVisibility(coopWrap, isCoop);
  setVisibility(teamWrap, isTeam);
}

/** Hide advanced rules for quick-play modes; fixed 10 rounds / 15s / visible answers. */
function configureQuickPlayLayout() {
  const marathon = gameMode === "solo" || gameMode === "marathon";
  const quick = isQuickPlayMode();
  document.body.classList.toggle("mode-quick-play", quick);

  const banner = getEl("quick-play-banner");
  if (banner) banner.classList.toggle("hidden", !quick);

  if (marathon) return;

  const hideIds = [
    "round-count-container",
    "lives-container",
    "question-mode-container",
    "time-limit-container",
    "answer-visibility-container",
  ];
  for (const id of hideIds) {
    setVisibility(getEl(id), !quick, quick ? { hideAsAbsolute: true } : { position: "static" });
  }

  if (quick) {
    const rc = getEl("round-count");
    const tl = getEl("time-limit");
    const av = getEl("answer-visibility");
    if (rc) rc.value = "10";
    if (tl) tl.value = "15";
    if (av) av.value = "visible";
  }
}

function configureMarathonMode(els) {
  if (els.roundCount) {
    els.roundCount.value = "unlimited";
    els.roundCount.disabled = true;
    els.roundCount.classList.add("disabled-select");
    setVisibility(els.roundCount, false);
  }

  setVisibility(els.marathonDisplay, true);
  setVisibility(els.marathonBadge, true);
  setVisibility(els.livesContainer, true);
  setVisibility(els.marathonBadgeLives, true);
  setVisibility(els.answerVisibility, false, { hideAsAbsolute: true });
}

function configureNormalMode(els) {
  if (els.roundCount) {
    els.roundCount.disabled = false;
    els.roundCount.classList.remove("disabled-select");
    if (els.roundCount.value === "unlimited") els.roundCount.value = "10";
    setVisibility(els.roundCount, true);
  }

  setVisibility(els.marathonDisplay, false);
  setVisibility(els.marathonBadge, false);
  setVisibility(els.livesContainer, false);
  setVisibility(els.marathonBadgeLives, false);
  setVisibility(els.answerVisibility, true, { position: "static" });
}

function loadSavedModeSettings() {
  const savedSettings = localStorage.getItem(`riffleSettings_${gameMode}`);
  if (!savedSettings) return;

  try {
    const settings = JSON.parse(savedSettings);
    const isMarathon = gameMode === "solo";
    const safeSet = (id, val) => {
      const el = getEl(id);
      if (el) el.value = val;
    };

    if (settings.timeLimit) safeSet("time-limit", settings.timeLimit);

    if (settings.rounds) {
      if (isMarathon) safeSet("marathon-round-count-hidden", "unlimited");
      else safeSet("round-count", settings.rounds);
    }

    if (settings.lives && isMarathon) safeSet("lives-count", settings.lives);

    if (settings.coopTeamSize) safeSet("coop-team-size", settings.coopTeamSize);
    if (settings.teamPlayersPerSide) safeSet("team-players-per-side", settings.teamPlayersPerSide);

    if (settings.categories && settings.categories.length > 0) {
      selectedCategories.length = 0;
      for (const c of settings.categories) {
        selectedCategories.push(c);
      }
    }
  } catch (e) {
    console.error("Failed to load saved settings:", e);
  }
}

function switchTab(tab) {
  const els = {
    settingsPanel: getEl("settings-panel"),
    chatPanel: getEl("chat-panel"),
    settingsTab: getEl("tab-settings"),
    chatTab: getEl("tab-chat"),
  };

  const activeClass = ["bg-purple-800", "bg-opacity-80"];
  const inactiveClass = ["bg-purple-600", "bg-opacity-40"];

  if (tab === "settings") {
    els.settingsPanel.classList.remove("hidden");
    els.chatPanel.classList.add("hidden");
    els.settingsTab.classList.add(...activeClass);
    els.settingsTab.classList.remove(...inactiveClass);
    els.chatTab.classList.add(...inactiveClass);
    els.chatTab.classList.remove(...activeClass);
    return;
  }

  els.settingsPanel.classList.add("hidden");
  els.chatPanel.classList.remove("hidden");
  els.chatTab.classList.add(...activeClass);
  els.chatTab.classList.remove(...inactiveClass);
  els.settingsTab.classList.add(...inactiveClass);
  els.settingsTab.classList.remove(...activeClass);
}

// --- SUMMARY UPDATE LOGIC ---

function updateSelectionsSummary() {
  if (typeof selectedCategories === "undefined") return;

  updateModeTitle();
  updateCategoriesList();
  updateSettingsSummary();
}

function updateModeTitle() {
  const modeDisplay = getEl("selection-game-mode");
  if (modeDisplay) modeDisplay.textContent = `${MODE_LABELS[gameMode] || "Marathon"} Mode`;
}

function updateCategoriesList() {
  const list = getEl("selected-categories-list");
  if (!list) return;

  list.innerHTML = "";

  if (!selectedCategories || selectedCategories.length === 0) {
    const li = document.createElement("li");
    li.className = "text-purple-300 text-sm italic";
    li.textContent = "No categories selected";
    list.appendChild(li);

    const startBtn = getEl("start-game");
    if (startBtn) startBtn.disabled = true;
    return;
  }

  const startBtn = getEl("start-game");
  if (startBtn) startBtn.disabled = false;

  const allGenres = getAllGenres();
  selectedCategories.forEach((id) => {
    const genre = allGenres.find((g) => g.id === id);
    if (!genre) return;

    const li = document.createElement("li");
    li.className =
      "mb-2 flex items-center rounded-full bg-purple-900 bg-opacity-50 px-3 py-1 text-white text-sm";
    li.innerHTML = `<span class="w-2 h-2 rounded-full bg-purple-400 mr-2"></span>${genre.name}`;
    list.appendChild(li);
  });
}

function updateSettingsSummary() {
  const isMarathon = gameMode === "solo";

  const qEl = getEl("selection-questions");
  if (qEl) {
    if (isMarathon) qEl.textContent = "Unlimited Questions (Marathon Mode)";
    else {
      const val = getEl("round-count")?.value;
      qEl.textContent = val === "unlimited" ? "Unlimited Questions" : `${val} Questions`;
    }
  }

  const tEl = getEl("selection-time");
  if (tEl) tEl.textContent = `${getEl("time-limit")?.value || "15"} seconds per answer`;

  const typeEl = getEl("selection-question-type");
  if (typeEl) {
    typeEl.textContent = "Random (Song / Artist / Album)";
  }

  const visCont = getEl("selection-visibility-container");
  const visLabel = getEl("selection-visibility");
  if (visCont && visLabel) {
    if (isMarathon) setVisibility(visCont, false);
    else {
      setVisibility(visCont, true, { display: "flex" });
      const val = getEl("answer-visibility")?.value || "visible";
      visLabel.textContent = VISIBILITY_LABELS[val] || "Answers Visible to All";
    }
  }

  const livesCont = getEl("selection-lives-container");
  const livesLabel = getEl("selection-lives");
  if (livesCont && livesLabel) {
    if (!isMarathon) {
      setVisibility(livesCont, false);
    } else {
      setVisibility(livesCont, true, { display: "flex" });
      const val = getEl("lives-count")?.value || "3";
      if (val === "0") livesLabel.textContent = "No Lives - One Strike Out";
      else if (val === "unlimited") livesLabel.textContent = "Unlimited Lives (Practice)";
      else livesLabel.textContent = `${val} Lives`;
    }
  }
}

// --- EVENT LISTENERS ---

document.addEventListener("DOMContentLoaded", () => {
  setupGameModeSettings();
  updateSelectionsSummary();

  ["round-count", "time-limit", "lives-count", "answer-visibility", "coop-team-size", "team-players-per-side"].forEach(
    (id) => {
      getEl(id)?.addEventListener("change", updateSelectionsSummary);
    }
  );

  const categoriesGrid = getEl("categories-grid");
  if (categoriesGrid) {
    new MutationObserver(updateSelectionsSummary).observe(categoriesGrid, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".category-card");

    // Category Selection Logic
    if (card) {
      const categoryId = card.dataset.id;
      if (typeof toggleCategory === "function") {
        toggleCategory(categoryId);
        updateSelectionsSummary();
      } else {
        console.error("CRITICAL ERROR: toggleCategory function is NOT available!");
      }
    }

    // Copy Link
    if (event.target.closest("#copy-invite")) {
      const link = getEl("invite-link");
      if (link) {
        link.select();
        document.execCommand("copy");
        alert("Invite link copied!");
      }
    }

    // Send Message
    if (event.target.closest("#send-message")) {
      sendChatMessage();
    }
  });

  getEl("chat-input")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  document.querySelectorAll(".category-filter").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".category-filter").forEach((b) => {
        b.classList.remove("bg-purple-800", "bg-opacity-80");
        b.classList.add("bg-purple-600", "bg-opacity-40");
      });
      this.classList.remove("bg-purple-600", "bg-opacity-40");
      this.classList.add("bg-purple-800", "bg-opacity-80");
      filterCategories(this.dataset.filter);
    });
  });
});

export { setupGameModeSettings, loadSavedModeSettings, switchTab, updateSelectionsSummary };
