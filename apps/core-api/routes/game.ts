import type { FastifyPluginAsync } from "fastify";
import { createGame, getGame } from "../controllers/gameController";

const gameRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/create", createGame);
  fastify.get("/:id", getGame);
};

export default gameRoutes;
