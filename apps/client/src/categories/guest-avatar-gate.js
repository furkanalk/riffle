import { mountAvatarPicker } from "../ui/avatar-picker.js";

/**
 * Guests without a stored avatar must pick one before using the lobby.
 * @returns {Promise<void>}
 */
export async function maybeShowGuestAvatarGate() {
  const token = localStorage.getItem("token");
  if (token) return;

  if (localStorage.getItem("selectedAvatar")) return;

  const modal = document.getElementById("guest-avatar-modal");
  const grid = document.getElementById("guest-avatar-grid");
  const btn = document.getElementById("guest-avatar-continue");
  if (!modal || !grid || !btn) return;

  return new Promise((resolve) => {
    const picker = mountAvatarPicker(grid, { selectedId: "avatar1" });

    const onContinue = () => {
      const id = picker.getSelected();
      localStorage.setItem("selectedAvatar", id);
      modal.classList.add("hidden");
      resolve();
    };

    btn.addEventListener("click", onContinue, { once: true });
    modal.classList.remove("hidden");
  });
}
