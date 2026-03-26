function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
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
  const empty = document.getElementById("leaderboard-empty");

  const MEDALS = ["🥇", "🥈", "🥉"];

  function renderCard(row, rank) {
    const score = escapeHtml(String(row.score ?? 0));
    const username = escapeHtml(row.username || "?");
    const avatar = escapeHtml(row.avatar || "avatar1");
    const medal = rank <= 3 ? MEDALS[rank - 1] : `#${rank}`;
    const podiumClass = rank <= 3 ? ` leaderboard-row--podium leaderboard-row--podium-${rank}` : "";
    return `
      <li class="leaderboard-row${podiumClass}">
        <div class="leaderboard-rank">${medal}</div>
        <div class="leaderboard-user">
          <span class="leaderboard-avatar-wrap">
            <img class="leaderboard-avatar" src="./src/img/avatars/${avatar}.png" alt="">
          </span>
          <span class="leaderboard-name">${username}</span>
        </div>
        <div class="leaderboard-score-wrap">
          <span class="leaderboard-score">${score}</span>
          <span class="leaderboard-pts">pts</span>
        </div>
      </li>
    `;
  }

  async function load() {
    if (!list || !empty || !modeSel) return;
    empty.textContent = "No scores yet for this mode.";
    const mode = modeSel.value;
    list.innerHTML = "";
    list.classList.remove("hidden");
    list.classList.add("leaderboard-list--loading");
    try {
      const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=15`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const entries = data.entries || [];
      if (entries.length === 0) {
        list.classList.add("hidden");
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      list.innerHTML = entries.map((row, idx) => renderCard(row, idx + 1)).join("");
    } catch (e) {
      list.classList.add("hidden");
      empty.textContent = e instanceof Error ? e.message : "Could not load leaderboard.";
      empty.classList.remove("hidden");
    } finally {
      list.classList.remove("leaderboard-list--loading");
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
