#!/usr/bin/env node
/**
 * Switch the Prisma datasource provider without hand-editing the schema.
 *
 *   node scripts/prepare-db.mjs --postgres   # rewrite to postgresql
 *   node scripts/prepare-db.mjs --sqlite     # rewrite back to sqlite
 *   node scripts/prepare-db.mjs              # use DATABASE_PROVIDER, else no-op
 *
 * Deployment uses the no-flag form: set DATABASE_PROVIDER=postgresql on the
 * host and the build picks the right client. Locally the variable is unset, so
 * the schema stays on SQLite and nothing changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "prisma", "schema.prisma");
const PROVIDERS = new Set(["sqlite", "postgresql"]);

function resolveProvider(argv) {
  if (argv.includes("--postgres") || argv.includes("--postgresql")) return "postgresql";
  if (argv.includes("--sqlite")) return "sqlite";

  const fromEnv = (process.env.DATABASE_PROVIDER ?? "").trim().toLowerCase();
  if (fromEnv === "postgres" || fromEnv === "postgresql") return "postgresql";
  if (fromEnv === "sqlite") return "sqlite";
  return null;
}

const target = resolveProvider(process.argv.slice(2));

if (!target) {
  console.log(
    "[prepare-db] DATABASE_PROVIDER is not set — leaving prisma/schema.prisma on its current provider.",
  );
  process.exit(0);
}

if (!PROVIDERS.has(target)) {
  console.error(`[prepare-db] Unsupported provider: ${target}`);
  process.exit(1);
}

const source = readFileSync(SCHEMA_PATH, "utf8");
const pattern = /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"(sqlite|postgresql)"/;
const match = source.match(pattern);

if (!match) {
  console.error(
    "[prepare-db] Could not find the datasource provider in prisma/schema.prisma",
  );
  process.exit(1);
}

if (match[2] === target) {
  console.log(`[prepare-db] prisma/schema.prisma already uses "${target}".`);
  process.exit(0);
}

writeFileSync(SCHEMA_PATH, source.replace(pattern, `$1"${target}"`), "utf8");
console.log(`[prepare-db] prisma/schema.prisma provider set to "${target}".`);
