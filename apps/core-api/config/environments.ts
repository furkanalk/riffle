import crypto from "node:crypto";

export type Environment = "development" | "production";

interface EnvConfig {
  corsOrigin: string | string[];
  logLevel: "debug" | "info" | "warn" | "error" | "silent";
  apiKey: string;
  databaseUrl: string | undefined;
}

function generateApiKey(env: string): string {
  return crypto.createHash("sha256").update(`riffle-${env}-secret`).digest("hex").substring(0, 32);
}

export const config: Record<Environment, EnvConfig> = {
  development: {
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    logLevel: "debug",
    apiKey: process.env.RIFFLE_API_KEY ?? generateApiKey("development"),
    databaseUrl: process.env.DATABASE_URL,
  },
  production: {
    corsOrigin: process.env.CORS_ORIGIN ?? "https://riffle.com",
    logLevel: "warn",
    apiKey: process.env.RIFFLE_API_KEY ?? generateApiKey("production"),
    databaseUrl: process.env.DATABASE_URL,
  },
};

export function validateApiKey(providedKey: string, environment: Environment): boolean {
  const envConfig = config[environment];
  if (!envConfig || !providedKey) return false;

  const provided = Buffer.from(providedKey);
  const expected = Buffer.from(envConfig.apiKey);

  if (provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(provided, expected);
}
