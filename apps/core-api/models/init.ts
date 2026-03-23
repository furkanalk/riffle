import { query } from "../config/db";

const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    avatar        VARCHAR(50)  DEFAULT 'avatar1',
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id        SERIAL PRIMARY KEY,
    user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_mode VARCHAR(20) NOT NULL,
    score     INTEGER     NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id     VARCHAR(50)  NOT NULL,
    track_title  VARCHAR(255),
    track_artist VARCHAR(255),
    added_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, track_id)
  );
`;

export async function initDatabase(): Promise<void> {
  try {
    await query(createTablesSQL);
    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}
