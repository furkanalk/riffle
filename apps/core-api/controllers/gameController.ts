import type { FastifyReply, FastifyRequest } from "fastify";

export async function createGame(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: Implement game creation
  reply.send({ message: "Game creation endpoint - to be implemented" });
}

export async function getGame(
  _req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  // TODO: Implement get game
  reply.send({ message: "Get game endpoint - to be implemented" });
}
