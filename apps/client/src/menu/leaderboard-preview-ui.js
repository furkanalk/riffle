import { avatarImgSrcFromRoot, DEFAULT_AVATAR_ID, normalizeAvatarId } from "../core/avatars.js";

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

/** @param {Record<string, unknown> | undefined} entry */
function previewSlot(entry, variant) {
  if (!entry) {
    return `<div class="main-lb-preview-ghost main-lb-preview-ghost--${variant}" aria-hidden="true"></div>`;
  }
  const rank = variant === "gold" ? "1" : variant === "silver" ? "2" : "3";
  const name = escapeHtml(entry.username || "?");
  const score = escapeHtml(String(entry.score ?? ""));
  const avatarId = normalizeAvatarId(entry.avatar || DEFAULT_AVATAR_ID);
  return `
    <div class="main-lb-preview-slot main-lb-preview-slot--${variant}">
      <div class="main-lb-preview-rank">${rank}</div>
      <div class="main-lb-preview-ring">
        <img src="${avatarImgSrcFromRoot(avatarId)}" alt="">
      </div>
      <div class="main-lb-preview-name">${name}</div>
      <div class="main-lb-preview-score">${score} pts</div>
      <div class="main-lb-preview-pedestal"></div>
    </div>
  `;
}

/** @param {Record<string, unknown>[]} topThree [1st, 2nd, 3rd] */
function previewPodiumMarkup(topThree) {
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];
  return `
    <div class="main-lb-preview-podium" role="list">
      ${previewSlot(second, "silver")}
      ${previewSlot(first, "gold")}
      ${previewSlot(third, "bronze")}
    </div>
  `;
}

export async function initMainLeaderboardPreview() {
  const preview = document.getElementById("main-leaderboard-preview");
  const modeSel = document.getElementById("main-leaderboard-mode");
  const list = document.getElementById("main-leaderboard-list");
  const empty = document.getElementById("main-leaderboard-empty");
  if (!preview || !modeSel || !list || !empty) return;

  async function load() {
    const mode = modeSel.value;
    empty.classList.add("hidden");
    list.innerHTML = "";

    try {
      const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=5`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load leaderboard.");

      const entries = Array.isArray(data.entries) ? data.entries : [];
      const top = entries.slice(0, 3);

      if (top.length === 0) {
        empty.classList.remove("hidden");
        return;
      }

      list.innerHTML = previewPodiumMarkup(top);
    } catch (e) {
      empty.classList.remove("hidden");
      empty.textContent = e instanceof Error ? e.message : "Could not load leaderboard.";
    }
  }

  modeSel.addEventListener("change", load);
  await load();
}
