import { avatarImgSrcFromRoot, DEFAULT_AVATAR_ID, normalizeAvatarId } from "../core/avatars.js";
import { getLang, t } from "../core/i18n.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/** @param {Record<string, unknown> | undefined} row */
function podiumSlot(row, variant, ptsLabel) {
  if (!row) {
    return `<div class="leaderboard-podium__ghost leaderboard-podium__ghost--${variant}" aria-hidden="true"></div>`;
  }
  const score = escapeHtml(String(row.score ?? ""));
  const username = escapeHtml(row.username || "?");
  const avatarId = normalizeAvatarId(row.avatar || DEFAULT_AVATAR_ID);
  const rankLabel = variant === "gold" ? "1" : variant === "silver" ? "2" : "3";
  const pts = escapeHtml(ptsLabel);
  return `
    <div class="leaderboard-podium__slot leaderboard-podium__slot--${variant}">
      <div class="leaderboard-podium__rank-badge">${rankLabel}</div>
      <div class="leaderboard-podium__avatar-ring">
        <img class="leaderboard-podium__avatar" src="${avatarImgSrcFromRoot(avatarId)}" alt="">
      </div>
      <div class="leaderboard-podium__name">${username}</div>
      <div class="leaderboard-podium__scoreline">
        <span class="leaderboard-podium__score">${score}</span>
        <span class="leaderboard-podium__pts">${pts}</span>
      </div>
      <div class="leaderboard-podium__pedestal"></div>
    </div>
  `;
}

/** @param {Record<string, unknown>[]} topThree [1st, 2nd, 3rd] */
function renderPodiumMarkup(topThree, ptsLabel) {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];
  return `
    <div class="leaderboard-podium__strip" role="list">
      ${podiumSlot(second, "silver", ptsLabel)}
      ${podiumSlot(first, "gold", ptsLabel)}
      ${podiumSlot(third, "bronze", ptsLabel)}
    </div>
  `;
}

/** @param {Record<string, unknown>} row */
function renderRestRow(row, rank, ptsLabel) {
  const score = escapeHtml(String(row.score ?? ""));
  const username = escapeHtml(row.username || "?");
  const avatarId = normalizeAvatarId(row.avatar || DEFAULT_AVATAR_ID);
  const pts = escapeHtml(ptsLabel);
  return `
    <li class="leaderboard-row leaderboard-row--rest">
      <div class="leaderboard-rank leaderboard-rank--num">${rank}</div>
      <div class="leaderboard-user">
        <span class="leaderboard-avatar-wrap">
          <img class="leaderboard-avatar" src="${avatarImgSrcFromRoot(avatarId)}" alt="">
        </span>
        <span class="leaderboard-name">${username}</span>
      </div>
      <div class="leaderboard-score-wrap">
        <span class="leaderboard-score">${score}</span>
        <span class="leaderboard-pts">${pts}</span>
      </div>
    </li>
  `;
}

export function initLeaderboard() {
  const openBtns = [
    document.getElementById("leaderboard-btn"),
    document.getElementById("menu-leaderboard-btn"),
  ].filter(Boolean);
  const panel = document.getElementById("leaderboard-panel");
  const closeBtn = document.getElementById("close-leaderboard");
  const modeSel = document.getElementById("leaderboard-mode");
  const list = document.getElementById("leaderboard-list");
  const podium = document.getElementById("leaderboard-podium");
  const empty = document.getElementById("leaderboard-empty");

  async function load() {
    if (!list || !empty || !modeSel) return;
    const lang = getLang();
    const ptsLabel = t("leaderboardUi.pts", lang);
    empty.textContent = t("leaderboardUi.emptyMode", lang);
    const mode = modeSel.value;
    list.innerHTML = "";
    list.classList.remove("hidden");
    list.classList.add("leaderboard-list--loading");
    if (podium) {
      podium.innerHTML = "";
      podium.classList.add("leaderboard-podium--empty", "leaderboard-podium--loading");
      podium.setAttribute("aria-hidden", "true");
    }
    try {
      const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=15`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("leaderboardUi.loadErrorShort", lang));
      const entries = Array.isArray(data.entries) ? data.entries : [];
      if (entries.length === 0) {
        list.classList.add("hidden");
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      if (podium) {
        podium.classList.remove("leaderboard-podium--empty", "leaderboard-podium--loading");
        podium.setAttribute("aria-hidden", "false");
        podium.innerHTML = renderPodiumMarkup(entries, ptsLabel);
      }
      const rest = entries.slice(3);
      if (rest.length === 0) {
        list.classList.add("hidden");
      } else {
        list.classList.remove("hidden");
        list.innerHTML = rest.map((row, i) => renderRestRow(row, i + 4, ptsLabel)).join("");
      }
    } catch (e) {
      list.classList.add("hidden");
      if (podium) {
        podium.innerHTML = "";
        podium.classList.add("leaderboard-podium--empty");
        podium.classList.remove("leaderboard-podium--loading");
        podium.setAttribute("aria-hidden", "true");
      }
      empty.textContent = e instanceof Error ? e.message : t("leaderboardUi.loadError", lang);
      empty.classList.remove("hidden");
    } finally {
      list.classList.remove("leaderboard-list--loading");
      if (podium) podium.classList.remove("leaderboard-podium--loading");
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      panel?.classList.remove("hidden");
      load();
    });
  });
  closeBtn?.addEventListener("click", () => panel?.classList.add("hidden"));
  panel?.addEventListener("click", (e) => {
    if (e.target === panel) panel.classList.add("hidden");
  });
  modeSel?.addEventListener("change", load);
}
