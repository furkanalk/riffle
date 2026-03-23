import type { FastifyPluginAsync } from "fastify";
import { getPlaylistTracks, getTrack } from "../controllers/tracksController";
import { authenticate } from "../middleware/auth";

const favoritesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", authenticate);
  fastify.get("/playlist/:playlistId/tracks", getPlaylistTracks);
  fastify.get("/track/:trackId", getTrack);
};

export default favoritesRoutes;
