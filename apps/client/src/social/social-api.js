/** @returns {Record<string, string>} */
export function authHeadersJson() {
  const t = localStorage.getItem("token") || localStorage.getItem("auth_token");
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export function hasAuthToken() {
  return Boolean(localStorage.getItem("token") || localStorage.getItem("auth_token"));
}

/**
 * @param {string} path - e.g. "/social/friends"
 * @param {RequestInit} [opts]
 */
export async function socialFetch(path, opts = {}) {
  const headers = { ...authHeadersJson(), ...opts.headers };
  return fetch(`/api${path}`, { ...opts, headers });
}

export async function pingPresence() {
  if (!hasAuthToken()) return;
  try {
    await socialFetch("/social/presence", { method: "POST", body: "{}" });
  } catch {
    /* ignore */
  }
}

export async function searchUsers(q) {
  const res = await socialFetch(`/social/users/search?q=${encodeURIComponent(q)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data.users || [];
}

export async function sendFriendRequest(toUserId) {
  const res = await socialFetch("/social/friends/request", {
    method: "POST",
    body: JSON.stringify({ toUserId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send request");
  return data;
}

export async function listFriendRequests() {
  const res = await socialFetch("/social/friends/requests");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load requests");
  return data.requests || [];
}

export async function acceptFriendRequest(requestId) {
  const res = await socialFetch(`/social/friends/requests/${requestId}/accept`, {
    method: "POST",
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not accept");
  return data;
}

export async function declineFriendRequest(requestId) {
  const res = await socialFetch(`/social/friends/requests/${requestId}/decline`, {
    method: "POST",
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not decline");
  return data;
}

export async function listFriends() {
  const res = await socialFetch("/social/friends");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load friends");
  return data.friends || [];
}

export async function listNotifications() {
  const res = await socialFetch("/social/notifications");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not load notifications");
  return data;
}

export async function markNotificationRead(id) {
  await socialFetch(`/social/notifications/${id}/read`, { method: "POST", body: "{}" });
}

export async function markAllNotificationsRead() {
  await socialFetch("/social/notifications/read-all", { method: "POST", body: "{}" });
}

export async function sendRoomInvite(toUserId, joinPath) {
  const res = await socialFetch("/social/room-invites", {
    method: "POST",
    body: JSON.stringify({ toUserId, joinPath }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send invite");
  return data;
}
