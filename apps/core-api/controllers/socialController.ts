import type { FastifyReply, FastifyRequest } from "fastify";
import { query } from "../config/db";
import type { JwtRequest } from "../middleware/jwtAuth";

const ONLINE_WINDOW_SQL = "NOW() - INTERVAL '2 minutes'";

function pairKey(u1: number, u2: number): [number, number] {
  return u1 < u2 ? [u1, u2] : [u2, u1];
}

function validateJoinPath(p: string): boolean {
  if (typeof p !== "string" || p.length < 8 || p.length > 800) return false;
  if (p.includes("..") || /\s/.test(p)) return false;
  if (/^https?:\/\//i.test(p)) return false;
  if (!p.includes("room=")) return false;
  if (!p.includes("categories.html")) return false;
  return /^[a-zA-Z0-9_./?&=%\-]+$/.test(p);
}

export async function pingPresence(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = (req as JwtRequest).userId;
  try {
    await query(
      `INSERT INTO user_presence (user_id, last_seen_at) VALUES ($1, NOW())
       ON CONFLICT (user_id) DO UPDATE SET last_seen_at = NOW()`,
      [userId]
    );
    reply.send({ ok: true });
  } catch (e) {
    req.log.error(e, "pingPresence");
    reply.code(500).send({ error: "Presence update failed." });
  }
}

export async function searchUsers(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = (req as JwtRequest).userId;
  const rawQ = String((req.query as { q?: string }).q ?? "").trim().slice(0, 30);
  const safe = rawQ.replace(/[%_]/g, "");
  if (safe.length < 2) {
    reply.send({ users: [] });
    return;
  }
  const pattern = `%${safe}%`;
  try {
    const r = await query(
      `SELECT u.id, u.username, u.avatar,
        (f.user_a IS NOT NULL) AS is_friend,
        EXISTS (
          SELECT 1 FROM friend_requests fr
          WHERE fr.from_user_id = $1 AND fr.to_user_id = u.id
        ) AS pending_out,
        EXISTS (
          SELECT 1 FROM friend_requests fr
          WHERE fr.from_user_id = u.id AND fr.to_user_id = $1
        ) AS pending_in
       FROM users u
       LEFT JOIN friendships f
         ON f.user_a = LEAST(u.id, $1) AND f.user_b = GREATEST(u.id, $1)
       WHERE u.id <> $1 AND u.username ILIKE $2
       ORDER BY u.username ASC
       LIMIT 20`,
      [userId, pattern]
    );
    const users = (
      r.rows as {
        id: number;
        username: string;
        avatar: string;
        is_friend: boolean;
        pending_out: boolean;
        pending_in: boolean;
      }[]
    ).map((row) => {
      let status: "friend" | "pending_out" | "pending_in" | "none" = "none";
      if (row.is_friend) status = "friend";
      else if (row.pending_out) status = "pending_out";
      else if (row.pending_in) status = "pending_in";
      return {
        id: row.id,
        username: row.username,
        avatar: row.avatar,
        friendStatus: status,
      };
    });
    reply.send({ users });
  } catch (e) {
    req.log.error(e, "searchUsers");
    reply.code(500).send({ error: "Search failed." });
  }
}

async function areFriends(a: number, b: number): Promise<boolean> {
  const [x, y] = pairKey(a, b);
  const r = await query("SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2", [x, y]);
  return r.rows.length > 0;
}

async function insertNotification(
  userId: number,
  type: string,
  fromUserId: number | null,
  payload: Record<string, unknown>
): Promise<number> {
  const r = await query(
    `INSERT INTO notifications (user_id, from_user_id, type, payload)
     VALUES ($1, $2, $3, $4::jsonb) RETURNING id`,
    [userId, fromUserId, type, JSON.stringify(payload)]
  );
  return Number((r.rows[0] as { id: number })?.id ?? 0);
}

export async function sendFriendRequest(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  const toUserId = Number((req.body as { toUserId?: number })?.toUserId);
  if (!Number.isInteger(toUserId) || toUserId < 1 || toUserId === me) {
    reply.code(400).send({ error: "Invalid user." });
    return;
  }
  try {
    const target = await query("SELECT id FROM users WHERE id = $1", [toUserId]);
    if (target.rows.length === 0) {
      reply.code(404).send({ error: "User not found." });
      return;
    }
    if (await areFriends(me, toUserId)) {
      reply.code(409).send({ error: "Already friends." });
      return;
    }

    const reverse = await query(
      "SELECT id FROM friend_requests WHERE from_user_id = $1 AND to_user_id = $2",
      [toUserId, me]
    );
    if (reverse.rows.length > 0) {
      const rid = (reverse.rows[0] as { id: number }).id;
      await query("DELETE FROM friend_requests WHERE id = $1", [rid]);
      const [a, b] = pairKey(me, toUserId);
      await query("INSERT INTO friendships (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
        a,
        b,
      ]);
      await insertNotification(toUserId, "friend_accepted", me, {});
      reply.send({ ok: true, autoAccepted: true });
      return;
    }

    const dup = await query(
      "SELECT id FROM friend_requests WHERE from_user_id = $1 AND to_user_id = $2",
      [me, toUserId]
    );
    if (dup.rows.length > 0) {
      reply.code(409).send({ error: "Request already sent." });
      return;
    }

    const ins = await query(
      "INSERT INTO friend_requests (from_user_id, to_user_id) VALUES ($1, $2) RETURNING id",
      [me, toUserId]
    );
    const requestId = (ins.rows[0] as { id: number } | undefined)?.id;
    if (requestId) {
      await insertNotification(toUserId, "friend_request", me, { requestId });
    }
    reply.code(201).send({ ok: true, requestId });
  } catch (e) {
    req.log.error(e, "sendFriendRequest");
    reply.code(500).send({ error: "Could not send request." });
  }
}

export async function listFriendRequests(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  try {
    const r = await query(
      `SELECT fr.id, fr.from_user_id, u.username, u.avatar, fr.created_at
       FROM friend_requests fr
       JOIN users u ON u.id = fr.from_user_id
       WHERE fr.to_user_id = $1
       ORDER BY fr.created_at DESC`,
      [me]
    );
    reply.send({ requests: r.rows as object[] });
  } catch (e) {
    req.log.error(e, "listFriendRequests");
    reply.code(500).send({ error: "Could not load requests." });
  }
}

export async function acceptFriendRequest(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  const requestId = parseInt(String((req.params as { id?: string }).id ?? ""), 10);
  if (!Number.isInteger(requestId)) {
    reply.code(400).send({ error: "Invalid request." });
    return;
  }
  try {
    const fr = await query(
      "SELECT from_user_id FROM friend_requests WHERE id = $1 AND to_user_id = $2",
      [requestId, me]
    );
    if (fr.rows.length === 0) {
      reply.code(404).send({ error: "Request not found." });
      return;
    }
    const fromId = (fr.rows[0] as { from_user_id: number }).from_user_id;
    await query("DELETE FROM friend_requests WHERE id = $1", [requestId]);
    const [a, b] = pairKey(me, fromId);
    await query("INSERT INTO friendships (user_a, user_b) VALUES ($1, $2) ON CONFLICT DO NOTHING", [a, b]);
    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND type = 'friend_request' AND (payload->>'requestId')::int = $2`,
      [me, requestId]
    );
    await insertNotification(fromId, "friend_accepted", me, {});
    reply.send({ ok: true });
  } catch (e) {
    req.log.error(e, "acceptFriendRequest");
    reply.code(500).send({ error: "Could not accept." });
  }
}

export async function declineFriendRequest(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  const requestId = parseInt(String((req.params as { id?: string }).id ?? ""), 10);
  if (!Number.isInteger(requestId)) {
    reply.code(400).send({ error: "Invalid request." });
    return;
  }
  try {
    const del = await query(
      "DELETE FROM friend_requests WHERE id = $1 AND to_user_id = $2 RETURNING id",
      [requestId, me]
    );
    if (del.rows.length === 0) {
      reply.code(404).send({ error: "Request not found." });
      return;
    }
    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND type = 'friend_request' AND (payload->>'requestId')::int = $2 AND read_at IS NULL`,
      [me, requestId]
    );
    reply.send({ ok: true });
  } catch (e) {
    req.log.error(e, "declineFriendRequest");
    reply.code(500).send({ error: "Could not decline." });
  }
}

export async function listFriends(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  try {
    const r = await query(
      `SELECT u.id, u.username, u.avatar,
        (p.last_seen_at IS NOT NULL AND p.last_seen_at > ${ONLINE_WINDOW_SQL}) AS online
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
       LEFT JOIN user_presence p ON p.user_id = u.id
       WHERE f.user_a = $1 OR f.user_b = $1
       ORDER BY online DESC, u.username ASC`,
      [me]
    );
    reply.send({ friends: r.rows as object[] });
  } catch (e) {
    req.log.error(e, "listFriends");
    reply.code(500).send({ error: "Could not load friends." });
  }
}

export async function sendRoomInvite(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  const body = req.body as { toUserId?: number; joinPath?: string };
  const toUserId = Number(body?.toUserId);
  const joinPath = String(body?.joinPath ?? "").trim();
  if (!Number.isInteger(toUserId) || toUserId < 1 || toUserId === me) {
    reply.code(400).send({ error: "Invalid user." });
    return;
  }
  if (!validateJoinPath(joinPath)) {
    reply.code(400).send({ error: "Invalid invite link." });
    return;
  }
  try {
    if (!(await areFriends(me, toUserId))) {
      reply.code(403).send({ error: "You can only invite friends." });
      return;
    }
    const nid = await insertNotification(toUserId, "room_invite", me, { joinPath });
    reply.code(201).send({ ok: true, notificationId: nid });
  } catch (e) {
    req.log.error(e, "sendRoomInvite");
    reply.code(500).send({ error: "Could not send invite." });
  }
}

export async function listNotifications(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  try {
    const r = await query(
      `SELECT n.id, n.type, n.payload, n.read_at, n.created_at,
        u.username AS from_username, u.avatar AS from_avatar
       FROM notifications n
       LEFT JOIN users u ON u.id = n.from_user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 80`,
      [me]
    );
    const rows = r.rows as {
      read_at: Date | null;
    }[];
    const unread = rows.filter((x) => x.read_at == null).length;
    reply.send({ notifications: r.rows, unreadCount: unread });
  } catch (e) {
    req.log.error(e, "listNotifications");
    reply.code(500).send({ error: "Could not load notifications." });
  }
}

export async function markNotificationRead(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  const id = parseInt(String((req.params as { id?: string }).id ?? ""), 10);
  if (!Number.isInteger(id)) {
    reply.code(400).send({ error: "Invalid id." });
    return;
  }
  try {
    await query(
      "UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL",
      [id, me]
    );
    reply.send({ ok: true });
  } catch (e) {
    req.log.error(e, "markNotificationRead");
    reply.code(500).send({ error: "Update failed." });
  }
}

export async function markAllNotificationsRead(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const me = (req as JwtRequest).userId;
  try {
    await query("UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL", [me]);
    reply.send({ ok: true });
  } catch (e) {
    req.log.error(e, "markAllNotificationsRead");
    reply.code(500).send({ error: "Update failed." });
  }
}
