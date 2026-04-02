import type { FastifyPluginAsync } from "fastify";

const matchmakerBaseUrl = (): string =>
  (process.env.MATCHMAKER_HTTP_URL || "http://127.0.0.1:8080").replace(/\/$/, "");

const matchmakerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/matchmaker/lobbies", async (_req, reply) => {
    const url = `${matchmakerBaseUrl()}/lobbies`;
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      if (!res.ok) {
        reply
          .code(res.status)
          .type("application/json")
          .send(text || `{"error":"matchmaker error"}`);
        return;
      }
      let data: unknown = { lobbies: [] };
      try {
        data = text ? JSON.parse(text) : { lobbies: [] };
      } catch {
        reply.code(502).send({ error: "Invalid matchmaker response", lobbies: [] });
        return;
      }
      reply.send(data);
    } catch (err) {
      fastify.log.warn({ err, url }, "[matchmaker] lobbies proxy failed");
      reply.code(503).send({ error: "Matchmaker unavailable", lobbies: [] });
    }
  });
};

export default matchmakerRoutes;
