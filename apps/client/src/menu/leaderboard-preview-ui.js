function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function avatarImg(avatarId) {
  return `./src/img/avatars/${avatarId || "avatar1"}.png`;
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

      const wrap = document.createElement("div");
      wrap.className = "flex items-center justify-between gap-3";

      const [first, second, third] = top;

      const big = (entry) => `
        <div class="flex flex-col items-center gap-2 flex-1">
          <div class="text-sm font-extrabold text-yellow-300">1</div>
          <div class="h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-yellow-400 bg-gray-800/40 flex items-center justify-center">
            <img src="${avatarImg(entry.avatar)}" alt="" class="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover" />
          </div>
          <div class="text-xs text-white font-bold truncate max-w-[6.5rem]">${escapeHtml(entry.username)}</div>
          <div class="text-xs text-purple-300 font-extrabold">${escapeHtml(String(entry.score ?? 0))} pts</div>
        </div>
      `;

      const small = (rank, entry, themeKey) => {
        const colorClass = themeKey === "amber" ? "text-amber-700" : "text-gray-300";
        const borderClass =
          themeKey === "amber" ? "border-amber-700/80" : "border-gray-300/80";

        return `
        <div class="flex flex-col items-center gap-2 flex-1">
          <div class="text-sm font-extrabold ${colorClass}">${escapeHtml(String(rank))}</div>
          <div class="h-12 w-12 rounded-full border ${borderClass} bg-gray-800/40 flex items-center justify-center">
            <img src="${avatarImg(entry.avatar)}" alt="" class="h-9 w-9 rounded-full object-cover" />
          </div>
          <div class="text-xs text-white font-bold truncate max-w-[6.5rem]">${escapeHtml(
            entry.username
          )}</div>
        </div>
      `;
      };

      // Avoid dynamic Tailwind classes for border/text colors.
      // Render theme using fixed sets.
      const markup = `
        <div class="grid grid-cols-3 gap-3 items-start w-full">
          ${first ? big(first) : ""}
          ${second ? small(2, second, "gray") : ""}
          ${third ? small(3, third, "amber") : ""}
        </div>
      `;

      list.innerHTML = markup;
    } catch (e) {
      empty.classList.remove("hidden");
      empty.textContent = e instanceof Error ? e.message : "Could not load leaderboard.";
    }
  }

  modeSel.addEventListener("change", load);
  await load();
}

