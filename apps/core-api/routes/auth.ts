import type { FastifyPluginAsync } from "fastify";
import { login, register, updateProfile } from "../controllers/authController";
import { requireJwt } from "../middleware/jwtAuth";
import { createSimpleRateLimit } from "../middleware/simpleRateLimit";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(createSimpleRateLimit({ max: 40, windowMs: 60_000 }));

  fastify.post("/register", register);
  fastify.post("/login", login);
  fastify.patch("/profile", { preHandler: requireJwt }, updateProfile);
};

export default authRoutes;
