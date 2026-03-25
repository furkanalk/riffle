import { AVATAR_IDS, DEFAULT_AVATAR_ID, avatarImgSrcFromRoot, isValidAvatarId } from "../core/avatars.js";

/**
 * @param {HTMLElement} container
 * @param {{ selectedId?: string, onPick?: (id: string) => void }} [opts]
 * @returns {{ getSelected: () => string }}
 */
export function mountAvatarPicker(container, opts = {}) {
  let current = isValidAvatarId(opts.selectedId) ? opts.selectedId : DEFAULT_AVATAR_ID;

  container.innerHTML = AVATAR_IDS.map((id) => {
    const sel = id === current;
    const border = sel
      ? "selected border-purple-500"
      : "border-purple-900 border-opacity-30";
    const n = id.replace("avatar", "");
    return `<button type="button" class="avatar-option ${border}" data-avatar="${id}" aria-pressed="${sel}">
      <div class="avatar-img-wrap">
        <img src="${avatarImgSrcFromRoot(id)}" alt="" class="avatar-img" />
      </div>
      <span class="avatar-name">Avatar ${n}</span>
    </button>`;
  }).join("");

  container.querySelectorAll(".avatar-option").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-avatar");
      if (!id) return;
      current = id;
      container.querySelectorAll(".avatar-option").forEach((o) => {
        const on = o === el;
        o.classList.toggle("selected", on);
        o.classList.toggle("border-purple-500", on);
        o.classList.toggle("border-purple-900", !on);
        o.classList.toggle("border-opacity-30", !on);
        o.setAttribute("aria-pressed", String(on));
      });
      opts.onPick?.(current);
    });
  });

  return {
    getSelected: () => current,
  };
}
