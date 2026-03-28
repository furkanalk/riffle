import type { FastifyReply, FastifyRequest } from "fastify";
import { query } from "../config/db";
import type { JwtRequest } from "../middleware/jwtAuth";

const GAME_MODES = new Set(["solo", "versus", "team", "coop", "custom", "chaos"]);

const MAX_SCORE = 1_000_000;

interface SubmitScoreBody {
  gameMode?: string;
  score?: number;
}

export async function submitScore(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = (req as JwtRequest).userId;
  const body = req.body as SubmitScoreBody;
  const gameMode = String(body.gameMode ?? "").slice(0, 20);
  const raw = body.score;
  const score = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);

  if (!GAME_MODES.has(gameMode)) {
    reply.code(400).send({ error: "Invalid game mode." });
    return;
  }

  if (!Number.isFinite(score) || score < 1 || score > MAX_SCORE) {
    reply.code(400).send({ error: "Invalid score." });
    return;
  }

  try {
    await query("INSERT INTO scores (user_id, game_mode, score) VALUES ($1, $2, $3)", [
      userId,
      gameMode,
      Math.floor(score),
    ]);
    reply.code(201).send({ ok: true });
  } catch (error) {
    req.log.error(error, "submitScore");
    reply.code(500).send({ error: "Could not save score." });
  }
}

export async function getLeaderboard(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const q = req.query as { mode?: string; limit?: string };
  const modeParam = String(q.mode ?? "solo").slice(0, 20);
  const mode = GAME_MODES.has(modeParam) ? modeParam : "solo";
  const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? "10", 10) || 10));

  try {
    // One row per user: their best score for this mode (avoids duplicate usernames in the list).
    const result = await query(
      `WITH best_per_user AS (
         SELECT DISTINCT ON (s.user_id)
           s.score,
           s.game_mode,
           s.played_at,
           u.username,
           u.avatar
         FROM scores s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.game_mode = $1
           AND s.score > 0
         ORDER BY s.user_id, s.score DESC, s.played_at ASC
       )
       SELECT score, game_mode, played_at, username, avatar
       FROM best_per_user
       ORDER BY score DESC, played_at ASC
       LIMIT $2`,
      [mode, limit]
    );
    reply.send({ mode, entries: result.rows });
  } catch (error) {
    req.log.error(error, "getLeaderboard");
    reply.code(500).send({ error: "Could not load leaderboard." });
  }
}
