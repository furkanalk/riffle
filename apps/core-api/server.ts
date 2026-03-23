import cors from "@fastify/cors";
import Fastify from "fastify";
import { type Environment, config, validateApiKey } from "./config/environments";
import { initDatabase } from "./models/init";
import routes from "./routes/index";

const NODE_ENV = (process.env.NODE_ENV as Environment) ?? "development";
const currentConfig = config[NODE_ENV];
const PORT = Number(process.env.PORT) || 3000;

const fastify = Fastify({
  logger: { level: currentConfig.logLevel },
});

// ── CORS ──────────────────────────────────────────────────────────────────────
await fastify.register(cors, { origin: currentConfig.corsOrigin });

// ── API KEY GUARD (inline — protects /secure-data) ───────────────────────────
fastify.get("/secure-data", {
  preHandler: async (req, reply) => {
    const key = req.headers["x-api-key"];
    if (!key || Array.isArray(key) || !validateApiKey(key, NODE_ENV)) {
      reply.code(401).send({ error: "Unauthorized: Invalid or missing API Key" });
    }
  },
  handler: async (_req, reply) => {
    reply.send({
      data: "Secure data accessed successfully.",
      context: "This endpoint is protected by API Key validation.",
    });
  },
});

// ── SYSTEM ROUTES ─────────────────────────────────────────────────────────────
fastify.get("/", async (_req, reply) => {
  reply.send({ message: "Riffle API is running", env: NODE_ENV });
});

fastify.get("/health", async (_req, reply) => {
  reply.send({ status: "OK", uptime: process.uptime() });
});

// ── APP ROUTES ────────────────────────────────────────────────────────────────
await fastify.register(routes, { prefix: "/api" });

// ── DATABASE ──────────────────────────────────────────────────────────────────
await initDatabase();

// ── START ─────────────────────────────────────────────────────────────────────
try {
  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  fastify.log.info(`Environment: ${NODE_ENV}`);
  if (NODE_ENV === "development") {
    fastify.log.info(`Dev API Key: ${currentConfig.apiKey}`);
  }
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

process.on("SIGTERM", async () => {
  fastify.log.info("SIGTERM received — shutting down");
  await fastify.close();
});
