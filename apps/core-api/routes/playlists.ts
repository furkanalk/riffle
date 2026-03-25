import type { FastifyPluginAsync } from "fastify";
import { getPlaylistById, PLAYLISTS } from "../data/playlists";

const playlistRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (_req, reply) => {
    reply.send(PLAYLISTS);
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const entry = getPlaylistById(req.params.id);
    if (!entry) {
      return reply.code(404).send({ error: "Playlist not found" });
    }
    reply.send(entry);
  });
};

export default playlistRoutes;
