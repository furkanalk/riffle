import type { FastifyPluginAsync } from "fastify";
import {
  acceptFriendRequest,
  declineFriendRequest,
  listFriendRequests,
  listFriends,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pingPresence,
  searchUsers,
  sendFriendRequest,
  sendRoomInvite,
} from "../controllers/socialController";
import { requireJwt } from "../middleware/jwtAuth";

const socialRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/social/presence", { preHandler: [requireJwt] }, pingPresence);
  fastify.get("/social/users/search", { preHandler: [requireJwt] }, searchUsers);
  fastify.post("/social/friends/request", { preHandler: [requireJwt] }, sendFriendRequest);
  fastify.get("/social/friends/requests", { preHandler: [requireJwt] }, listFriendRequests);
  fastify.post(
    "/social/friends/requests/:id/accept",
    { preHandler: [requireJwt] },
    acceptFriendRequest
  );
  fastify.post(
    "/social/friends/requests/:id/decline",
    { preHandler: [requireJwt] },
    declineFriendRequest
  );
  fastify.get("/social/friends", { preHandler: [requireJwt] }, listFriends);
  fastify.post("/social/room-invites", { preHandler: [requireJwt] }, sendRoomInvite);
  fastify.get("/social/notifications", { preHandler: [requireJwt] }, listNotifications);
  fastify.post(
    "/social/notifications/:id/read",
    { preHandler: [requireJwt] },
    markNotificationRead
  );
  fastify.post(
    "/social/notifications/read-all",
    { preHandler: [requireJwt] },
    markAllNotificationsRead
  );
};

export default socialRoutes;
