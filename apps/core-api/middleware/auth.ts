import type { FastifyReply, FastifyRequest } from "fastify";
import { type Environment, validateApiKey } from "../config/environments";

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const apiKey = request.headers["x-api-key"];
  const environment = (process.env.NODE_ENV as Environment) ?? "development";

  if (!apiKey || Array.isArray(apiKey)) {
    reply.code(401).send({ error: "API key required" });
    return;
  }

  if (!validateApiKey(apiKey, environment)) {
    reply.code(403).send({ error: "Invalid API key" });
  }
}
