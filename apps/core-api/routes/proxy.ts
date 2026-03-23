import type { FastifyPluginAsync } from "fastify";

const DEEZER_API = "https://api.deezer.com";

const proxyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>("/playlist/:id/tracks", async (req, reply) => {
    const { id } = req.params;
    req.log.info(`[proxy] Fetching playlist: ${id}`);
    const res = await fetch(`${DEEZER_API}/playlist/${id}/tracks?limit=50`);
    if (!res.ok) {
      reply.code(502).send({ error: `Deezer returned ${res.status}` });
      return;
    }
    const data = await res.json();
    if (data.error) {
      reply.code(502).send({ error: data.error.message });
      return;
    }
    reply.send(data);
  });

  fastify.get<{ Params: { id: string } }>("/album/:id/tracks", async (req, reply) => {
    const { id } = req.params;
    const res = await fetch(`${DEEZER_API}/album/${id}/tracks`);
    reply.send(await res.json());
  });

  fastify.get<{ Params: { id: string } }>("/preview/:id", async (req, reply) => {
    const { id } = req.params;
    const res = await fetch(`${DEEZER_API}/track/${id}`);
    const data = await res.json();
    if (data.error) {
      reply.code(502).send({ error: data.error.message });
      return;
    }
    reply.send({
      id: data.id,
      name: data.title,
      artists: data.artist.name,
      previewUrl: data.preview,
    });
  });
};

export default proxyRoutes;
