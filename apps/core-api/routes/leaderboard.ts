import type { FastifyPluginAsync } from "fastify";
import { getLeaderboard, submitScore } from "../controllers/leaderboardController";
import { requireJwt } from "../middleware/jwtAuth";
import { createSimpleRateLimit } from "../middleware/simpleRateLimit";

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic abuse protection on public leaderboard reads + authenticated score submissions.
  // (Auth scope is already rate-limited, but leaderboard is used without that scope.)
  await fastify.register(createSimpleRateLimit({ max: 60, windowMs: 60_000 }));
  fastify.get("/leaderboard", getLeaderboard);
  fastify.post("/scores", { preHandler: requireJwt }, submitScore);
};

export default leaderboardRoutes;
