import { z } from "zod";

/**
 * Server-side environment schema. Parsed lazily so that importing a module
 * during `next build` never throws before `.env` is available.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SEED_ADMIN_EMAIL: z.string().email().default("admin@evently.test"),
  SEED_ADMIN_PASSWORD: z.string().min(8).default("Admin@12345"),
  EMAIL_FROM: z.string().default("Evently <no-reply@evently.test>"),
  RESEND_API_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Lazy, typed access to environment variables (server-only). */
export const env: Env = new Proxy({} as Env, {
  get: (_target, key: string) => getEnv()[key as keyof Env],
});
