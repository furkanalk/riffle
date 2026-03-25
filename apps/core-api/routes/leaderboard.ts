import type { FastifyPluginAsync } from "fastify";
import { getLeaderboard, submitScore } from "../controllers/leaderboardController";
import { requireJwt } from "../middleware/jwtAuth";

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/leaderboard", getLeaderboard);
  fastify.post("/scores", { preHandler: requireJwt }, submitScore);
};

export default leaderboardRoutes;
