// Category filtering and management

import { getAllGenres } from "../core/music.js";
import { t } from "../core/i18n.js";
import { selectedCategories } from "./state.js";

/** Bumps when a new filter run starts so stale animation timeouts no-op (mobile). */
let categoryFilterAnimGeneration = 0;

function prefersInstantCategoryFilter() {
  try {
    return (
      window.matchMedia("(min-width: 641px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return true;
  }
}

const TYPE_META = {
  rock: { label: "Rock", accentClass: "is-rock", icon: "🎸" },
  metal: { label: "Metal", accentClass: "is-metal", icon: "🤘" },
  mixed: { label: "Mixed", accentClass: "is-mixed", icon: "🎚️" },
  turkish: { label: "Turkish", accentClass: "is-turkish", icon: "🇹🇷" },
  artist: { label: "Artist", accentClass: "is-artist", icon: "🎤" },
};

function getTypeMeta(categoryType) {
  const normalized = (categoryType || "mixed").toLowerCase();
  if (normalized.includes("rock")) return TYPE_META.rock;
  if (normalized.includes("metal")) return TYPE_META.metal;
  if (normalized.includes("turkish")) return TYPE_META.turkish;
  if (normalized.includes("artist")) return TYPE_META.artist;
  return TYPE_META.mixed;
}

function getEraLabel(genre, categoryType) {
  const era = String(genre?.era || "").toLowerCase();
  const name = String(genre?.name || "").toLowerCase();

  if (categoryType.includes("artist")) return "Artist focus";
  if (era && name.includes(era)) return "Catalog pick";
  if (genre?.era) return `${String(genre.era).toUpperCase()} era`;
  return "All-time picks";
}

function syncCategoryCardStates() {
  document.querySelectorAll(".category-card").forEach((card) => {
    const id = card.dataset.id;
    const selected = id ? selectedCategories.includes(id) : false;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
    const check = card.querySelector(".category-check");
    if (check) check.classList.toggle("is-checked", selected);
  });
}

function normalizeEra(era) {
  return String(era || "").toLowerCase();
}

/** Lowercase blob for artist search (name + optional aliases from genre data). */
function genreSearchBlob(genre) {
  const parts = [genre?.name, ...(Array.isArray(genre.searchAliases) ? genre.searchAliases : [])];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function resetCategoryCatalogScroll() {
  const el = document.querySelector(".cat-scroll-inner");
  if (!el) return;
  el.scrollLeft = 0;
}

function syncArtistSearchBar(typeFilter) {
  const wrap = document.getElementById("category-artist-search-wrap");
  const input = document.getElementById("category-artist-search");
  if (!wrap) return;
  const isArtist = String(typeFilter || "").toLowerCase() === "artist";
  wrap.classList.toggle("hidden", !isArtist);
  if (!isArtist && input) {
    input.value = "";
    window.currentArtistSearch = "";
  }
}

/** Call once after DOM; debounced input re-runs filterCategories. */
export function initCategoryArtistSearch() {
  window.currentArtistSearch = window.currentArtistSearch || "";
  const input = document.getElementById("category-artist-search");
  if (!input) return;
  let debounceTimer;
  input.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      window.currentArtistSearch = input.value;
      filterCategories(window.currentTypeFilter || "all", { preserveCatalogScroll: true });
    }, 120);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    input.value = "";
    window.currentArtistSearch = "";
    filterCategories(window.currentTypeFilter || "all");
  });
}

// Load music categories
export function loadCategories() {
  const categoriesGrid = document.getElementById("categories-grid");
  const genres = getAllGenres();

  if (!categoriesGrid) return;

  // Clear grid first
  categoriesGrid.innerHTML = "";

  genres.forEach((genre, index) => {
    const categoryType = (genre.category || genre.type || "mixed").toLowerCase();
    const typeMeta = getTypeMeta(categoryType);
    const eraLabel = getEraLabel(genre, categoryType);

    const card = document.createElement("div");
    card.className = `category-card category-card--catalog ${typeMeta.accentClass} opacity-0`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");

    card.dataset.id = genre.id;
    card.dataset.category = categoryType;
    card.dataset.era = normalizeEra(genre.era);
    card.dataset.searchText = genreSearchBlob(genre);

    card.innerHTML = `
      <div class="category-card__body">
        <div class="category-card__cover" aria-hidden="true">
          <span class="category-card__cover-icon">${typeMeta.icon}</span>
        </div>
        <div class="category-card__head">
          <span class="category-check" aria-hidden="true"></span>
          <span class="category-card__type">${typeMeta.label}</span>
        </div>
        <h3 class="category-card__title">${genre.name}</h3>
        <p class="category-card__subtitle">${eraLabel}</p>
      </div>
    `;

    categoriesGrid.appendChild(card);

    // Entrance Animation
    setTimeout(
      () => {
        card.classList.remove("opacity-0");
      },
      100 + index * 50
    );

    // Pre-select check
    syncCategoryCardStates();

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleCategory(genre.id);
    });
  });
}

// Toggle category selection
export function toggleCategory(id) {
  const card = document.querySelector(`.category-card[data-id="${id}"]`);
  if (!card) return;

  const index = selectedCategories.indexOf(id);

  if (index > -1) {
    // Remove
    selectedCategories.splice(index, 1);
  } else {
    // Add
    selectedCategories.push(id);
  }
  syncCategoryCardStates();

  // Animation for panel
  const selectionsPanel = document.getElementById("selections-panel");
  if (selectionsPanel) {
    selectionsPanel.classList.add("scale-105", "shadow-xl");
    setTimeout(() => {
      selectionsPanel.classList.remove("scale-105", "shadow-xl");
    }, 300);
  }
}

/**
 * @param {string} [filter]
 * @param {{ preserveCatalogScroll?: boolean }} [options] If true, keep horizontal scroll (artist search typing).
 */
export function filterCategories(filter, options = {}) {
  const { preserveCatalogScroll = false } = options;
  const typeFilter = String(filter || window.currentTypeFilter || "all").toLowerCase();
  const eraFilter = String(window.currentEraFilter || "all").toLowerCase();
  const cards = document.querySelectorAll(".category-card");
  const emptyState = document.getElementById("categories-empty-state");
  const cardsArray = Array.from(cards);

  window.currentTypeFilter = typeFilter;
  window.currentFilter = typeFilter; // keep backwards compatibility

  const cardsToShow = [];
  const cardsToHide = [];

  const searchQ = String(window.currentArtistSearch || "")
    .trim()
    .toLowerCase();
  const artistSearchActive = typeFilter === "artist" && searchQ.length > 0;

  cardsArray.forEach((card) => {
    const categoryType = card.dataset.category || "";
    const era = card.dataset.era || "";
    const typeMatch = typeFilter === "all" || categoryType.includes(typeFilter);
    const eraMatch = eraFilter === "all" || era === eraFilter;

    let matches = typeMatch && eraMatch;
    if (matches && artistSearchActive && categoryType.includes("artist")) {
      const hay = card.dataset.searchText || "";
      matches = hay.includes(searchQ);
    }

    if (matches) {
      cardsToShow.push(card);
    } else {
      cardsToHide.push(card);
    }
  });

  syncArtistSearchBar(typeFilter);

  const instant = prefersInstantCategoryFilter();

  if (instant) {
    // Desktop / reduced motion: one pass, no timers, no forced reflow — avoids UI jank.
    for (const card of cardsToHide) {
      card.style.display = "none";
    }
    for (const card of cardsToShow) {
      card.style.display = "flex";
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    }
  } else {
    const gen = ++categoryFilterAnimGeneration;
    const isStale = () => gen !== categoryFilterAnimGeneration;

    cardsToHide.forEach((card, index) => {
      window.setTimeout(() => {
        if (isStale()) return;
        card.classList.add("opacity-0", "scale-95");
        window.setTimeout(() => {
          if (isStale()) return;
          card.style.display = "none";
        }, 300);
      }, index * 30);
    });

    cardsToShow.forEach((card, index) => {
      window.setTimeout(
        () => {
          if (isStale()) return;
          card.style.display = "flex";
          void card.offsetWidth;
          card.classList.remove("opacity-0", "scale-95");
          card.classList.add("opacity-100", "scale-100");
        },
        300 + index * 50
      );
    });
  }

  if (emptyState) {
    emptyState.classList.toggle("hidden", cardsToShow.length > 0);
    if (cardsToShow.length === 0) {
      const sq = String(window.currentArtistSearch || "").trim();
      if (typeFilter === "artist" && sq) {
        emptyState.textContent = t("categoriesPage.emptyArtistSearch");
      } else {
        emptyState.textContent = t("categoriesPage.emptyCategoriesFilter");
      }
    }
  }

  if (!preserveCatalogScroll) {
    resetCategoryCatalogScroll();
  }
}

export function setEraFilter(era) {
  window.currentEraFilter = String(era || "all").toLowerCase();
  filterCategories(window.currentTypeFilter || "all");
}

// Debug function  (can be removed later)
export function debugCategories() {
  const cards = document.querySelectorAll(".category-card");
  console.log(`Total categories: ${cards.length}`);
  console.log("Selected:", selectedCategories);
}
