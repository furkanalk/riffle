import type { FastifyPluginAsync } from "fastify";
import { getLeaderboard, submitScore } from "../controllers/leaderboardController";
import { requireJwt } from "../middleware/jwtAuth";
import rateLimit from "@fastify/rate-limit";

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic abuse protection on public leaderboard reads + authenticated score submissions.
  // (Auth scope is already rate-limited, but leaderboard is used without that scope.)
  await fastify.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

  fastify.get("/leaderboard", getLeaderboard);
  fastify.post("/scores", { preHandler: requireJwt }, submitScore);
};

export default leaderboardRoutes;
