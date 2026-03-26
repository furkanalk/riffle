import { getEffectiveAvatarId } from "../core/user-manager.js";

/**
 * Guests without a stored avatar must pick one before using the lobby.
 * @returns {Promise<void>}
 */
export async function maybeShowGuestAvatarGate() {
  const token = localStorage.getItem("token");
  if (token) return;
  // Guests now get a random avatar automatically (no picker/editing).
  getEffectiveAvatarId();
}
