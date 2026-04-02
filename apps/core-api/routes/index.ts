import type { FastifyPluginAsync } from "fastify";
import authRoutes from "./auth";
import favoritesRoutes from "./favorites";
import gameRoutes from "./game";
import leaderboardRoutes from "./leaderboard";
import matchmakerRoutes from "./matchmaker";
import playlistRoutes from "./playlists";
import proxyRoutes from "./proxy";
import socialRoutes from "./social";

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(gameRoutes, { prefix: "/game" });
  fastify.register(favoritesRoutes, { prefix: "/favorites" });
  fastify.register(playlistRoutes, { prefix: "/playlists" });
  fastify.register(leaderboardRoutes);
  fastify.register(socialRoutes);
  fastify.register(matchmakerRoutes);
  fastify.register(proxyRoutes);
};

export default routes;
