import "../css/ambient-effects.css";
import "../css/app-preferences.css";
import { initAmbientEffects } from "../core/ambient-effects.js";
import { applyAppPreferenceClasses } from "../core/app-preferences.js";
import { initRoomSim } from "../lobby/room-sim.js";
import { sendChatMessage } from "./category-chat.js";
import {
  debugCategories,
  filterCategories,
  initCategoryArtistSearch,
  loadCategories,
  setEraFilter,
} from "./category-filters.js";
import { startGame } from "./category-game.js";
import {
  refreshCategoriesDynamicI18n,
  setupGameModeSettings,
  switchTab,
  updateSelectionsSummary,
} from "./category-settings.js";
import { maybeShowGuestAvatarGate } from "./guest-avatar-gate.js";
import { applyModeLayout } from "./mode-layout.js";
import "./menu-navigation.js";
import { applyCategoriesPageLanguage, getLang, t } from "../core/i18n.js";
import { initLobbyFriendInvites } from "../social/lobby-friend-invites.js";
import { initSocialFeatures } from "../social/social-init.js";
import { gameMode, selectedCategories } from "./state.js";

/** Set in `initMobileCategoryFilterSheets` (mobile) so language changes can refresh trigger labels. */
let syncMobileCategoryFilterTriggers = null;

// Init DOM
document.addEventListener("DOMContentLoaded", async () => {
  applyAppPreferenceClasses();
  initAmbientEffects();
  applyCategoriesPageLanguage(getLang());
  await maybeShowGuestAvatarGate();
  applyModeLayout();
  init();
  window.addEventListener("riffle-lang-changed", () => {
    applyCategoriesPageLanguage(getLang());
    refreshCategoriesDynamicI18n();
    filterCategories(window.currentTypeFilter || "all", { preserveCatalogScroll: true });
    syncMobileCategoryFilterTriggers?.();
    const sheet = document.getElementById("mobile-select-sheet");
    const sheetTitle = document.getElementById("mobile-select-sheet-title");
    const sheetClose = document.getElementById("mobile-select-sheet-close");
    if (sheet?.classList.contains("hidden") && sheetTitle) {
      sheetTitle.textContent = t("categoriesPage.selectPlaceholder");
    }
    if (sheetClose) sheetClose.setAttribute("aria-label", t("categoriesPage.sheetCloseAria"));
  });
});

function init() {
  initSocialFeatures({ categoriesOnly: true });
  initMobileBackButton();
  initModeActionLayout();
  initGameSettings();
  initStartButton();
  initLobbyStartMirror();
  initRoomSim();
  initLobbyFriendInvites();
  initScrollButtons();
  initTouchInteractions();
  initMobileSelectSheet();
  initMatchEntryActions();
  initSettingsListeners();
  initInviteCopy();
  initChat();
  initCategoryFilters();
  initMobileCategoryFilterSheets();
  initCategoryArtistSearch();
  initTabs();
  consumeCategoriesEntryIntent();
}

const RIFFLE_CATEGORIES_INITIAL_TAB_KEY = "riffle_categories_initial_tab";

/** Main menu “Settings” card lands here and opens the game settings tab (not the account profile). */
function consumeCategoriesEntryIntent() {
  try {
    const initial = sessionStorage.getItem(RIFFLE_CATEGORIES_INITIAL_TAB_KEY);
    if (initial !== "settings") return;
    sessionStorage.removeItem(RIFFLE_CATEGORIES_INITIAL_TAB_KEY);
    const p = new URLSearchParams(window.location.search);
    if (p.get("lobby") === "1" || p.get("search") === "1") return;
    switchTab("settings");
  } catch {
    /* ignore */
  }
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
      lobbyHint.textContent = sourceHint.textContent || t("categoriesPage.lobbyStartHint");
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

/** @type {HTMLSelectElement | null} */
let mobileSelectSheetActiveSelect = null;

function closeMobileSelectSheet() {
  document.getElementById("mobile-select-sheet")?.classList.add("hidden");
  document.body.classList.remove("no-scroll");
  mobileSelectSheetActiveSelect = null;
}

function ensureMobileSelectSheetBase() {
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
    const st = document.getElementById("mobile-select-sheet-title");
    if (st) st.textContent = t("categoriesPage.selectPlaceholder");
    document
      .getElementById("mobile-select-sheet-close")
      ?.setAttribute("aria-label", t("categoriesPage.sheetCloseAria"));
  }
  if (sheet.dataset.sheetBound === "1") return;
  sheet.dataset.sheetBound = "1";
  document
    .getElementById("mobile-select-sheet-close")
    ?.addEventListener("click", closeMobileSelectSheet);
  sheet.addEventListener("click", (e) => {
    if (e.target?.dataset?.closeSheet === "1") closeMobileSelectSheet();
  });
}

function initMobileSelectSheet() {
  if (window.matchMedia("(min-width: 641px)").matches) return;

  ensureMobileSelectSheetBase();

  const selectIds = [
    "round-count",
    "time-limit",
    "answer-visibility",
    "coop-team-size",
    "team-players-per-side",
  ];

  const selectElements = selectIds.map((id) => document.getElementById(id)).filter(Boolean);

  const sheet = document.getElementById("mobile-select-sheet");
  const titleEl = document.getElementById("mobile-select-sheet-title");
  const optionsEl = document.getElementById("mobile-select-sheet-options");
  const triggerMap = new Map();

  const openSheetForSelect = (selectEl) => {
    mobileSelectSheetActiveSelect = selectEl;
    const labelText =
      selectEl.closest(".setting-field")?.querySelector(".field-label")?.textContent?.trim() ||
      t("categoriesPage.selectPlaceholder");
    if (titleEl) titleEl.textContent = labelText;
    if (!optionsEl || !sheet) return;

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
        if (!mobileSelectSheetActiveSelect) return;
        mobileSelectSheetActiveSelect.value = opt.value;
        mobileSelectSheetActiveSelect.dispatchEvent(new Event("change", { bubbles: true }));
        closeMobileSelectSheet();
      });
      optionsEl.appendChild(rowBtn);
    });

    sheet.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  };

  if (selectElements.length === 0) return;

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
    trigger.textContent =
      selectEl.options[selectEl.selectedIndex]?.textContent || t("categoriesPage.selectPlaceholder");
    triggerMap.set(selectEl, trigger);

    trigger.addEventListener("click", () => {
      if (selectEl.disabled) return;
      openSheetForSelect(selectEl);
    });
    selectEl.insertAdjacentElement("afterend", trigger);
    selectEl.addEventListener("change", () => {
      const trig = triggerMap.get(selectEl);
      if (trig) {
        trig.textContent =
          selectEl.options[selectEl.selectedIndex]?.textContent || t("categoriesPage.selectPlaceholder");
      }
    });
  });
}

/** Mobile: replace horizontal genre/era chips with tap → bottom sheet (same UX as setting selects). */
function initMobileCategoryFilterSheets() {
  if (window.matchMedia("(min-width: 641px)").matches) return;

  const triggersRoot = document.getElementById("category-filter-mobile-triggers");
  if (!triggersRoot) return;

  const typeButtons = () => Array.from(document.querySelectorAll(".category-filter"));
  const eraButtons = () => Array.from(document.querySelectorAll(".era-filter"));
  if (typeButtons().length === 0 || eraButtons().length === 0) return;

  ensureMobileSelectSheetBase();

  const sheet = document.getElementById("mobile-select-sheet");
  const titleEl = document.getElementById("mobile-select-sheet-title");
  const optionsEl = document.getElementById("mobile-select-sheet-options");
  if (!sheet || !titleEl || !optionsEl) return;

  const typeTrigger = document.createElement("button");
  typeTrigger.type = "button";
  typeTrigger.className = "mobile-select-trigger";
  typeTrigger.setAttribute("aria-haspopup", "dialog");

  const eraTrigger = document.createElement("button");
  eraTrigger.type = "button";
  eraTrigger.className = "mobile-select-trigger";
  eraTrigger.setAttribute("aria-haspopup", "dialog");

  function findActiveTypeBtn() {
    return (
      document.querySelector(".category-filter.bg-purple-800") ||
      document.querySelector(".category-filter.chip--active") ||
      typeButtons()[0]
    );
  }

  function findActiveEraBtn() {
    return (
      document.querySelector(".era-filter.bg-purple-800") ||
      document.querySelector(".era-filter.chip--active") ||
      eraButtons()[0]
    );
  }

  function syncTriggerLabels() {
    const tb = findActiveTypeBtn();
    const eb = findActiveEraBtn();
    typeTrigger.textContent = tb
      ? `${t("categoriesPage.mobileStylePrefix")} ${tb.textContent.trim()}`
      : t("categoriesPage.mobileStyleFallback");
    eraTrigger.textContent = eb
      ? `${t("categoriesPage.mobileEraPrefix")} ${eb.textContent.trim()}`
      : t("categoriesPage.mobileEraFallback");
  }

  function applyTypeFilterUI(btn) {
    typeButtons().forEach((b) => {
      b.classList.remove("bg-purple-800", "bg-opacity-80", "chip--active");
      b.classList.add("bg-purple-600", "bg-opacity-40");
    });
    btn.classList.remove("bg-purple-600", "bg-opacity-40");
    btn.classList.add("bg-purple-800", "bg-opacity-80", "chip--active");
    filterCategories(btn.dataset.filter);
    syncTriggerLabels();
  }

  function applyEraFilterUI(btn) {
    eraButtons().forEach((b) => {
      b.classList.remove("bg-purple-800", "bg-opacity-80", "chip--active");
      b.classList.add("bg-purple-600", "bg-opacity-40");
    });
    btn.classList.remove("bg-purple-600", "bg-opacity-40");
    btn.classList.add("bg-purple-800", "bg-opacity-80", "chip--active");
    setEraFilter(btn.dataset.eraFilter);
    syncTriggerLabels();
  }

  function openTypeSheet() {
    mobileSelectSheetActiveSelect = null;
    titleEl.textContent = t("categoriesPage.sheetMusicStyle");
    optionsEl.innerHTML = "";
    const active = findActiveTypeBtn();
    for (const btn of typeButtons()) {
      const isActive =
        btn === active ||
        (btn.dataset.filter &&
          active?.dataset?.filter &&
          btn.dataset.filter === active.dataset.filter);
      const rowBtn = document.createElement("button");
      rowBtn.type = "button";
      rowBtn.className = `mobile-select-sheet__option${isActive ? " is-active" : ""}`;
      rowBtn.innerHTML = `
        <span class="mobile-select-sheet__option-label">${btn.textContent.trim()}</span>
        ${isActive ? '<span class="mobile-select-sheet__check">✓</span>' : ""}
      `;
      rowBtn.addEventListener("click", () => {
        applyTypeFilterUI(btn);
        closeMobileSelectSheet();
      });
      optionsEl.appendChild(rowBtn);
    }
    sheet.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }

  function openEraSheet() {
    mobileSelectSheetActiveSelect = null;
    titleEl.textContent = t("categoriesPage.sheetEraTitle");
    optionsEl.innerHTML = "";
    const active = findActiveEraBtn();
    for (const btn of eraButtons()) {
      const isActive =
        btn === active ||
        (btn.dataset.eraFilter &&
          active?.dataset?.eraFilter &&
          btn.dataset.eraFilter === active.dataset.eraFilter);
      const rowBtn = document.createElement("button");
      rowBtn.type = "button";
      rowBtn.className = `mobile-select-sheet__option${isActive ? " is-active" : ""}`;
      rowBtn.innerHTML = `
        <span class="mobile-select-sheet__option-label">${btn.textContent.trim()}</span>
        ${isActive ? '<span class="mobile-select-sheet__check">✓</span>' : ""}
      `;
      rowBtn.addEventListener("click", () => {
        applyEraFilterUI(btn);
        closeMobileSelectSheet();
      });
      optionsEl.appendChild(rowBtn);
    }
    sheet.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }

  triggersRoot.replaceChildren(typeTrigger, eraTrigger);
  typeTrigger.addEventListener("click", openTypeSheet);
  eraTrigger.addEventListener("click", openEraSheet);
  syncTriggerLabels();
  syncMobileCategoryFilterTriggers = syncTriggerLabels;
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
    alert(t("categoriesPage.alertCopyShort"));
  });
}

function initChat() {
  document.getElementById("send-message")?.addEventListener("click", sendChatMessage);
  document
    .getElementById("chat-input")
    ?.addEventListener("keypress", (e) => e.key === "Enter" && sendChatMessage());
}

function initCategoryFilters() {
  const typeButtons = document.querySelectorAll(".category-filter");
  const eraButtons = document.querySelectorAll(".era-filter");

  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      typeButtons.forEach(resetFilterButton);
      activateFilterButton(btn);
      filterCategories(btn.dataset.filter);
    });
  });

  eraButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      eraButtons.forEach(resetFilterButton);
      activateFilterButton(btn);
      setEraFilter(btn.dataset.eraFilter);
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
      alert(t("categoriesPage.alertSelectCategory"));
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
