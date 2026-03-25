import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
});

pool.on("error", (err: Error) => {
  console.error("🔥 Unexpected error on idle client", err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

export default pool;
