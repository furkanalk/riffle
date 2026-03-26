import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "riffle_dev_jwt_secret";

export type JwtRequest = FastifyRequest & { userId: number };

export async function requireJwt(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    await reply.code(401).send({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    (req as JwtRequest).userId = decoded.id;
  } catch {
    await reply.code(401).send({ error: "Invalid or expired token" });
  }
}
