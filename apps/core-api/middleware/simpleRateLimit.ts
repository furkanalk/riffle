import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

/**
 * In-memory fixed-window rate limiter (per Fastify encapsulation scope).
 * For multi-instance deployments, use an edge proxy or Redis-backed limits instead.
 */
export function createSimpleRateLimit(opts: {
  max: number;
  windowMs: number;
}): FastifyPluginAsync {
  const { max, windowMs } = opts;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return async (fastify) => {
    fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
      const key = request.ip ?? "unknown";
      const now = Date.now();
      let b = buckets.get(key);
      if (!b || now >= b.resetAt) {
        b = { count: 0, resetAt: now + windowMs };
        buckets.set(key, b);
      }
      b.count += 1;
      if (b.count > max) {
        return reply.code(429).type("application/json").send({ error: "Too many requests" });
      }
    });
  };
}
