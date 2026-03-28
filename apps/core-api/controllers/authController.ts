import bcrypt from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt, { type SignOptions } from "jsonwebtoken";
import { query } from "../config/db";
import type { JwtRequest } from "../middleware/jwtAuth";
import type { UserRow } from "../models/user";

const ALLOWED_AVATARS = new Set(Array.from({ length: 9 }, (_, i) => `avatar-${i + 1}`));

/** Reserved / misleading usernames (extend as needed). */
const BLOCKED_USERNAMES = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "support",
  "help",
  "riffle",
  "system",
  "root",
  "null",
  "undefined",
]);

// Simple placeholder to reduce obviously harmful usernames.
// Extend this list over time (or replace with a more robust moderation system).
const BLOCKED_SUBSTRINGS = ["sex", "porn", "xxx", "fuck", "shit", "bitch", "asshole"];

const JWT_SECRET = process.env.JWT_SECRET ?? "riffle_dev_jwt_secret";
const TOKEN_EXPIRES_IN = (process.env.TOKEN_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];

const MAX_USERNAME_LEN = 20;
const MIN_USERNAME_LEN = 3;
const MAX_EMAIL_LEN = 100;
const MAX_PASSWORD_LEN = 128;
const MAX_LOGIN_IDENTIFIER_LEN = 100;

/** Letters, numbers, underscore only — matches client-side rules. */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_PATTERN = /^[\x21-\x7E]+$/;

function clip(s: string, max: number): string {
  return s.trim().slice(0, max);
}

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
  reply: FastifyReply
): Promise<void> {
  const raw = req.body;
  const username = clip(String(raw.username ?? ""), MAX_USERNAME_LEN);
  const email = clip(String(raw.email ?? ""), MAX_EMAIL_LEN).toLowerCase();
  const password = String(raw.password ?? "").slice(0, MAX_PASSWORD_LEN);

  if (!username || !email || !password) {
    reply.code(400).send({ error: "All fields are required." });
    return;
  }

  if (
    username.length < MIN_USERNAME_LEN ||
    username.length > MAX_USERNAME_LEN ||
    !USERNAME_PATTERN.test(username)
  ) {
    reply.code(400).send({
      error: "Username must be 3–20 characters: letters, numbers, and underscores only.",
    });
    return;
  }

  if (BLOCKED_USERNAMES.has(username.toLowerCase())) {
    reply.code(400).send({ error: "This username is reserved." });
    return;
  }

  if (BLOCKED_SUBSTRINGS.some((s) => username.toLowerCase().includes(s))) {
    reply.code(400).send({ error: "Please choose a different username." });
    return;
  }

  if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL_LEN) {
    reply.code(400).send({ error: "Invalid email address." });
    return;
  }

  if (password.length < 6 || !PASSWORD_PATTERN.test(password)) {
    reply.code(400).send({
      error: "Password must be at least 6 printable ASCII characters.",
    });
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
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar, created_at",
      [username, email, passwordHash]
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
  reply: FastifyReply
): Promise<void> {
  const identifier = clip(String(req.body.identifier ?? ""), MAX_LOGIN_IDENTIFIER_LEN);
  const password = String(req.body.password ?? "").slice(0, MAX_PASSWORD_LEN);

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

interface UpdateProfileBody {
  avatar?: string;
  username?: string;
}

export async function updateProfile(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = (req as JwtRequest).userId;
  const body = req.body as UpdateProfileBody;
  const hasAvatar = body.avatar !== undefined;
  const hasUsername = body.username !== undefined;

  if (!hasAvatar && !hasUsername) {
    reply.code(400).send({ error: "Provide avatar and/or username." });
    return;
  }

  if (hasUsername) {
    const u = clip(String(body.username), MAX_USERNAME_LEN);
    if (u.length < MIN_USERNAME_LEN || u.length > MAX_USERNAME_LEN || !USERNAME_PATTERN.test(u)) {
      reply.code(400).send({
        error: "Username must be 3–20 characters: letters, numbers, and underscores only.",
      });
      return;
    }
    if (BLOCKED_USERNAMES.has(u.toLowerCase())) {
      reply.code(400).send({ error: "This username is reserved." });
      return;
    }

    if (BLOCKED_SUBSTRINGS.some((s) => u.toLowerCase().includes(s))) {
      reply.code(400).send({ error: "Please choose a different username." });
      return;
    }
  }

  if (hasAvatar && (!body.avatar || !ALLOWED_AVATARS.has(body.avatar))) {
    reply.code(400).send({ error: "Invalid avatar." });
    return;
  }

  try {
    if (hasUsername) {
      const u = clip(String(body.username), MAX_USERNAME_LEN);
      const taken = await query("SELECT id FROM users WHERE username = $1 AND id <> $2", [
        u,
        userId,
      ]);
      if (taken.rows.length > 0) {
        reply.code(409).send({ error: "Username already taken." });
        return;
      }
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;

    if (hasUsername) {
      sets.push(`username = $${n++}`);
      values.push(clip(String(body.username), MAX_USERNAME_LEN));
    }
    if (hasAvatar) {
      sets.push(`avatar = $${n++}`);
      values.push(body.avatar as string);
    }
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${n} RETURNING id, username, email, avatar, created_at`,
      values
    );
    if (result.rows.length === 0) {
      reply.code(404).send({ error: "User not found." });
      return;
    }
    reply.send({ user: result.rows[0] as UserRow });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === "23505") {
      reply.code(409).send({ error: "Username already taken." });
      return;
    }
    req.log.error(error, "Update profile error");
    reply.code(500).send({ error: "Server error while updating profile." });
  }
}
