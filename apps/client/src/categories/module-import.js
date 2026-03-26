import { initRoomSim } from "../lobby/room-sim.js";
import { sendChatMessage } from "./category-chat.js";
import { debugCategories, filterCategories, loadCategories } from "./category-filters.js";
import { startGame } from "./category-game.js";
import { setupGameModeSettings, switchTab, updateSelectionsSummary } from "./category-settings.js";
import { maybeShowGuestAvatarGate } from "./guest-avatar-gate.js";
import { applyModeLayout } from "./mode-layout.js";
import "./menu-navigation.js";
import { applyCategoriesLanguage, getLang } from "../core/i18n.js";
import { gameMode, selectedCategories } from "./state.js";

// Init DOM
document.addEventListener("DOMContentLoaded", async () => {
  applyCategoriesLanguage(getLang());
  await maybeShowGuestAvatarGate();
  applyModeLayout();
  init();
});

function init() {
  initMobileBackButton();
  initModeActionLayout();
  initGameSettings();
  initStartButton();
  initLobbyStartMirror();
  initRoomSim();
  initScrollButtons();
  initTouchInteractions();
  initMobileSelectSheet();
  initMatchEntryActions();
  initSettingsListeners();
  initInviteCopy();
  initChat();
  initCategoryFilters();
  initTabs();
}

function initMobileBackButton() {
  const btn = document.getElementById("mobile-history-back");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "./index.html";
  });
}

function initLobbyStartMirror() {
  const realBtn = document.getElementById("start-game");
  const lobbyBtn = document.getElementById("lobby-start-game");
  const lobbyHint = document.getElementById("lobby-start-hint");
  const sourceHint = document.getElementById("start-hint");
  if (!realBtn || !lobbyBtn) return;

  const sync = () => {
    lobbyBtn.disabled = realBtn.disabled;
    if (lobbyHint && sourceHint) {
      lobbyHint.textContent = sourceHint.textContent || "Select categories and wait for players";
    }
  };

  new MutationObserver(sync).observe(realBtn, { attributes: true, attributeFilter: ["disabled"] });
  if (sourceHint) {
    new MutationObserver(sync).observe(sourceHint, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  sync();
}

function initModeActionLayout() {
  const isMarathon = gameMode === "solo" || gameMode === "marathon";
  const show = (id, yes) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !yes);
  };

  show("marathon-actions-mobile", isMarathon);
  show("marathon-actions-desktop", isMarathon);
  show("multiplayer-actions-mobile", !isMarathon);
  show("multiplayer-actions-desktop", !isMarathon);
}

// Section Initializers
function initGameSettings() {
  setupGameModeSettings();
  updateSelectionsSummary();
  loadCategories();
}

function initStartButton() {
  const btn = document.getElementById("start-game");
  if (!btn) return;
  btn.addEventListener("click", startGame);
  btn.disabled = selectedCategories.length === 0;
}

function initScrollButtons() {
  const container = document.querySelector(".overflow-x-auto");
  document
    .getElementById("scroll-left")
    ?.addEventListener("click", () => container?.scrollBy({ left: -400, behavior: "smooth" }));
  document
    .getElementById("scroll-right")
    ?.addEventListener("click", () => container?.scrollBy({ left: 400, behavior: "smooth" }));
}

function initTouchInteractions() {
  const scrollContainer = document.querySelector(".cat-scroll-inner");
  if (scrollContainer) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onPointerDown = (e) => {
      isDown = true;
      scrollContainer.classList.add("is-dragging");
      startX = e.pageX;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const walk = (e.pageX - startX) * 1.1;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    const onPointerUp = () => {
      isDown = false;
      scrollContainer.classList.remove("is-dragging");
    };

    scrollContainer.addEventListener("pointerdown", onPointerDown);
    scrollContainer.addEventListener("pointermove", onPointerMove);
    scrollContainer.addEventListener("pointerup", onPointerUp);
    scrollContainer.addEventListener("pointerleave", onPointerUp);
    scrollContainer.addEventListener("pointercancel", onPointerUp);
  }

  // NOTE: swipe-to-switch tabs was removed because it caused accidental
  // panel changes while horizontally scrolling/filtering on mobile.
}

function initMobileSelectSheet() {
  if (window.matchMedia("(min-width: 641px)").matches) return;

  const selectIds = [
    "round-count",
    "time-limit",
    "answer-visibility",
    "coop-team-size",
    "team-players-per-side",
  ];

  const selectElements = selectIds.map((id) => document.getElementById(id)).filter(Boolean);

  if (selectElements.length === 0) return;

  let sheet = document.getElementById("mobile-select-sheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "mobile-select-sheet";
    sheet.className = "mobile-select-sheet hidden";
    sheet.innerHTML = `
      <div class="mobile-select-sheet__backdrop" data-close-sheet="1"></div>
      <div class="mobile-select-sheet__panel">
        <div class="mobile-select-sheet__head">
          <h3 id="mobile-select-sheet-title" class="mobile-select-sheet__title">Select</h3>
          <button id="mobile-select-sheet-close" type="button" class="mobile-select-sheet__close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="mobile-select-sheet-options" class="mobile-select-sheet__options"></div>
      </div>
    `;
    document.body.appendChild(sheet);
  }

  const titleEl = document.getElementById("mobile-select-sheet-title");
  const optionsEl = document.getElementById("mobile-select-sheet-options");
  const closeBtn = document.getElementById("mobile-select-sheet-close");
  let activeSelect = null;
  const triggerMap = new Map();

  const closeSheet = () => {
    sheet.classList.add("hidden");
    document.body.classList.remove("no-scroll");
    activeSelect = null;
  };

  const openSheetForSelect = (selectEl) => {
    activeSelect = selectEl;
    const labelText =
      selectEl.closest(".setting-field")?.querySelector(".field-label")?.textContent?.trim() ||
      "Select";
    if (titleEl) titleEl.textContent = labelText;
    if (!optionsEl) return;

    optionsEl.innerHTML = "";
    Array.from(selectEl.options).forEach((opt) => {
      const rowBtn = document.createElement("button");
      rowBtn.type = "button";
      rowBtn.className = `mobile-select-sheet__option${opt.value === selectEl.value ? " is-active" : ""}`;
      rowBtn.innerHTML = `
        <span class="mobile-select-sheet__option-label">${opt.textContent || opt.value}</span>
        ${opt.value === selectEl.value ? '<span class="mobile-select-sheet__check">✓</span>' : ""}
      `;
      rowBtn.addEventListener("click", () => {
        if (!activeSelect) return;
        activeSelect.value = opt.value;
        activeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        closeSheet();
      });
      optionsEl.appendChild(rowBtn);
    });

    sheet.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  };

  selectElements.forEach((selectEl) => {
    const isMarathon = gameMode === "solo" || gameMode === "marathon";
    const hiddenByLayout = window.getComputedStyle(selectEl).display === "none";
    if ((isMarathon && selectEl.id === "round-count") || hiddenByLayout) return;

    if (selectEl.dataset.mobileEnhanced === "1") return;
    selectEl.classList.add("mobile-select-native-hidden");
    selectEl.dataset.mobileEnhanced = "1";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "mobile-select-trigger";
    trigger.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || "Select";
    triggerMap.set(selectEl, trigger);

    trigger.addEventListener("click", () => {
      if (selectEl.disabled) return;
      openSheetForSelect(selectEl);
    });
    selectEl.insertAdjacentElement("afterend", trigger);
    selectEl.addEventListener("change", () => {
      const t = triggerMap.get(selectEl);
      if (t) t.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || "Select";
    });
  });

  closeBtn?.addEventListener("click", closeSheet);
  sheet.addEventListener("click", (e) => {
    if (e.target?.dataset?.closeSheet === "1") closeSheet();
  });
}

function initSettingsListeners() {
  for (const id of [
    "round-count",
    "question-type",
    "time-limit",
    "answer-visibility",
    "coop-team-size",
    "team-players-per-side",
  ]) {
    document.getElementById(id)?.addEventListener("change", updateSelectionsSummary);
  }
}

function initInviteCopy() {
  document.getElementById("copy-invite")?.addEventListener("click", () => {
    const link = document.getElementById("invite-link");
    link.select();
    document.execCommand("copy");
    alert("Copy!");
  });
}

function initChat() {
  document.getElementById("send-message")?.addEventListener("click", sendChatMessage);
  document
    .getElementById("chat-input")
    ?.addEventListener("keypress", (e) => e.key === "Enter" && sendChatMessage());
}

function initCategoryFilters() {
  const buttons = document.querySelectorAll(".category-filter");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach(resetFilterButton);
      activateFilterButton(btn);
      filterCategories(btn.dataset.filter);
    });
  });
}

function resetFilterButton(btn) {
  btn.classList.remove("bg-purple-800", "bg-opacity-80");
  btn.classList.add("bg-purple-600", "bg-opacity-40");
}

function activateFilterButton(btn) {
  btn.classList.remove("bg-purple-600", "bg-opacity-40");
  btn.classList.add("bg-purple-800", "bg-opacity-80");
}

function initTabs() {
  const settingsTab = document.getElementById("tab-settings");
  const backBtn = document.getElementById("lobby-back-settings");

  if (settingsTab) {
    settingsTab.addEventListener("click", () => switchTab("settings"));
  }
  if (backBtn) {
    backBtn.addEventListener("click", () => switchTab("settings"));
  }
}

function buildMatchSignature() {
  const cats = [...selectedCategories].sort().join(",") || "any";
  const timeLimit = document.getElementById("time-limit")?.value || "15";
  return `${gameMode}|${cats}|${timeLimit}`;
}

function initMatchEntryActions() {
  const createBtns = [
    document.getElementById("settings-create-game"),
    document.getElementById("settings-create-game-desktop"),
  ].filter(Boolean);
  const searchBtns = [
    document.getElementById("settings-search-game"),
    document.getElementById("settings-search-game-desktop"),
  ].filter(Boolean);

  const go = ({ search = false } = {}) => {
    if (selectedCategories.length === 0) {
      alert("Please select at least one category!");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("mode", gameMode);
    url.searchParams.set("ws", "1");
    url.searchParams.set("lobby", "1");
    if (search) {
      url.searchParams.set("search", "1");
      url.searchParams.set("sig", buildMatchSignature());
    } else {
      url.searchParams.delete("search");
      url.searchParams.delete("sig");
      url.searchParams.delete("room");
    }
    window.location.href = url.toString();
  };

  createBtns.forEach((btn) => {
    btn.addEventListener("click", () => go({ search: false }));
  });
  searchBtns.forEach((btn) => {
    btn.addEventListener("click", () => go({ search: true }));
  });

  const p = new URLSearchParams(window.location.search);
  if (p.get("lobby") === "1" || p.get("search") === "1") {
    switchTab("chat");
  }
}

// Debug
window.debugRiffleCategories = debugCategories;
