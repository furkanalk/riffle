import bcrypt from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { query } from "../config/db";
import type { UserRow } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET ?? "riffle_dev_jwt_secret";
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN ?? "1d";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  identifier: string;
  password: string;
}

export async function register(
  req: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    reply.code(400).send({ error: "All fields are required." });
    return;
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1 OR username = $2", [
      email,
      username,
    ]);
    if (existing.rows.length > 0) {
      reply.code(409).send({ error: "Username or email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
      [username, email, passwordHash],
    );

    const newUser = result.rows[0] as UserRow;
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
    });

    reply.code(201).send({ message: "User registered successfully!", token, user: newUser });
  } catch (error) {
    req.log.error(error, "Register error");
    reply.code(500).send({ error: "Server error during registration." });
  }
}

export async function login(
  req: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    reply.code(400).send({ error: "All fields are required." });
    return;
  }

  try {
    const result = await query("SELECT * FROM users WHERE email = $1 OR username = $1", [
      identifier,
    ]);

    if (result.rows.length === 0) {
      reply.code(404).send({ error: "User not found." });
      return;
    }

    const user = result.rows[0] as UserRow;
    const isMatch = await bcrypt.compare(password, user.password_hash ?? "");

    if (!isMatch) {
      reply.code(401).send({ error: "Invalid credentials." });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    const { password_hash: _pw, ...safeUser } = user;
    reply.send({ message: "Login successful!", token, user: safeUser });
  } catch (error) {
    req.log.error(error, "Login error");
    reply.code(500).send({ error: "Server error during login." });
  }
}
