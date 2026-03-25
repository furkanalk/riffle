function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export function initLeaderboard() {
  const openBtn = document.getElementById("leaderboard-btn");
  const panel = document.getElementById("leaderboard-panel");
  const closeBtn = document.getElementById("close-leaderboard");
  const modeSel = document.getElementById("leaderboard-mode");
  const list = document.getElementById("leaderboard-list");
  const empty = document.getElementById("leaderboard-empty");

  async function load() {
    if (!list || !empty || !modeSel) return;
    empty.textContent = "No scores yet for this mode.";
    const mode = modeSel.value;
    list.innerHTML = "";
    try {
      const res = await fetch(`/api/leaderboard?mode=${encodeURIComponent(mode)}&limit=15`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      const entries = data.entries || [];
      if (entries.length === 0) {
        empty.classList.remove("hidden");
        return;
      }
      empty.classList.add("hidden");
      entries.forEach((row) => {
        const li = document.createElement("li");
        li.className = "leaderboard-row";
        li.innerHTML = `<span class="leaderboard-score">${escapeHtml(String(row.score))}</span> <span class="leaderboard-pts">pts</span> — <span class="leaderboard-name">${escapeHtml(
          row.username || "?"
        )}</span>`;
        list.appendChild(li);
      });
    } catch (e) {
      empty.textContent = e instanceof Error ? e.message : "Could not load leaderboard.";
      empty.classList.remove("hidden");
    }
  }

  openBtn?.addEventListener("click", () => {
    panel?.classList.remove("hidden");
    load();
  });
  closeBtn?.addEventListener("click", () => panel?.classList.add("hidden"));
  panel?.addEventListener("click", (e) => {
    if (e.target === panel) panel.classList.add("hidden");
  });
  modeSel?.addEventListener("change", load);
}
