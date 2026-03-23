import type { FastifyPluginAsync } from "fastify";

const DEEZER_API = "https://api.deezer.com";

async function deezerFetch(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    throw Object.assign(new Error(`Deezer returned ${res.status}`), { status: 502 });
  }
  const data = await res.json() as Record<string, unknown>;
  if (data?.error) {
    const msg = (data.error as Record<string, unknown>)?.message ?? "Deezer error";
    throw Object.assign(new Error(String(msg)), { status: 502 });
  }
  return data;
}

const proxyRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/playlist/:id/tracks
  fastify.get<{ Params: { id: string } }>("/playlist/:id/tracks", async (req, reply) => {
    const { id } = req.params;
    req.log.info(`[proxy] playlist ${id}`);
    try {
      const data = await deezerFetch(`${DEEZER_API}/playlist/${id}/tracks?limit=100`);
      return reply.send(data);
    } catch (err: unknown) {
      req.log.error(err, "Deezer playlist proxy error");
      const status = (err as { status?: number }).status ?? 502;
      return reply.code(status).send({ error: (err as Error).message ?? "Failed to reach Deezer" });
    }
  });

  // GET /api/album/:id/tracks
  fastify.get<{ Params: { id: string } }>("/album/:id/tracks", async (req, reply) => {
    const { id } = req.params;
    try {
      const data = await deezerFetch(`${DEEZER_API}/album/${id}/tracks`);
      return reply.send(data);
    } catch (err: unknown) {
      req.log.error(err, "Deezer album proxy error");
      const status = (err as { status?: number }).status ?? 502;
      return reply.code(status).send({ error: (err as Error).message ?? "Failed to reach Deezer" });
    }
  });

  // GET /api/preview/:id
  fastify.get<{ Params: { id: string } }>("/preview/:id", async (req, reply) => {
    const { id } = req.params;
    try {
      const data = await deezerFetch(`${DEEZER_API}/track/${id}`) as Record<string, unknown>;
      return reply.send({
        id:         data.id,
        name:       data.title,
        artists:    (data.artist as Record<string, unknown>)?.name,
        previewUrl: data.preview,
      });
    } catch (err: unknown) {
      req.log.error(err, "Deezer preview proxy error");
      const status = (err as { status?: number }).status ?? 502;
      return reply.code(status).send({ error: (err as Error).message ?? "Failed to reach Deezer" });
    }
  });

  // GET /api/stream/:id  — proxies raw MP3 bytes to avoid browser CORS blocks on Deezer CDN
  fastify.get<{ Params: { id: string } }>("/stream/:id", async (req, reply) => {
    const { id } = req.params;
    try {
      const track = await deezerFetch(`${DEEZER_API}/track/${id}`) as Record<string, unknown>;
      const previewUrl = track.preview as string | undefined;
      if (!previewUrl) {
        return reply.code(404).send({ error: "No preview available for this track" });
      }
      const upstream = await fetch(previewUrl);
      if (!upstream.ok) {
        return reply.code(502).send({ error: `CDN returned ${upstream.status}` });
      }
      reply.header("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");
      reply.header("Cache-Control", "public, max-age=3600");
      return reply.send(upstream.body);
    } catch (err: unknown) {
      req.log.error(err, "Deezer stream proxy error");
      return reply.code(502).send({ error: (err as Error).message ?? "Stream failed" });
    }
  });
};

export default proxyRoutes;
