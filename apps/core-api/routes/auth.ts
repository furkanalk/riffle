import type { FastifyPluginAsync } from "fastify";
import { login, register } from "../controllers/authController";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", register);
  fastify.post("/login", login);
};

export default authRoutes;
