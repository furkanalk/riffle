import rateLimit from "@fastify/rate-limit";
import type { FastifyPluginAsync } from "fastify";
import { login, register, updateProfile } from "../controllers/authController";
import { requireJwt } from "../middleware/jwtAuth";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 40,
    timeWindow: "1 minute",
  });

  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.patch("/profile", { preHandler: requireJwt }, updateProfile);
};

export default authRoutes;
