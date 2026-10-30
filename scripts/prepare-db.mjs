#!/usr/bin/env node
/**
 * Keep the Prisma datasource provider in sync with DATABASE_URL.
 *
 * The provider is inferred from the URL scheme, so there is no flag to forget:
 *
 *   file:...                        -> sqlite
 *   postgres:// / postgresql://     -> postgresql
 *
 * Explicit `--sqlite` / `--postgres` flags override the inference, but a flag that
 * contradicts DATABASE_URL is treated as an error rather than silently producing a
 * client that cannot connect.
 *
 * Runs automatically from `postinstall` and `vercel-build`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "prisma", "schema.prisma");
const PATTERN = /(datasource\s+db\s*\{[^}]*?provider\s*=\s*)"(sqlite|postgresql)"/;

// Locally DATABASE_URL lives in .env, which `node` does not load by itself.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile?.();
  } catch {
    // No .env file — fine on a host that injects real environment variables.
  }
}

function providerFromUrl(url) {
  const value = (url ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
  if (value.startsWith("file:")) return "sqlite";
  if (value.startsWith("postgres://") || value.startsWith("postgresql://")) {
    return "postgresql";
  }
  return null;
}

function flagProvider(argv) {
  if (argv.includes("--postgres") || argv.includes("--postgresql")) return "postgresql";
  if (argv.includes("--sqlite")) return "sqlite";
  return null;
}

const argv = process.argv.slice(2);
const fromFlag = flagProvider(argv);
const fromProviderVar = (() => {
  const value = (process.env.DATABASE_PROVIDER ?? "").trim().toLowerCase();
  if (value === "postgres" || value === "postgresql") return "postgresql";
  if (value === "sqlite") return "sqlite";
  return null;
})();
const fromUrl = providerFromUrl(process.env.DATABASE_URL);

const requested = fromFlag ?? fromProviderVar ?? fromUrl;

if (!requested) {
  console.log(
    "[prepare-db] No DATABASE_URL and no provider hint — leaving prisma/schema.prisma untouched.",
  );
  process.exit(0);
}

// A provider that disagrees with the URL can only ever produce a broken client.
if (fromUrl && fromUrl !== requested) {
  const source = fromFlag
    ? `the ${fromFlag === "sqlite" ? "--sqlite" : "--postgres"} flag`
    : "DATABASE_PROVIDER";
  console.error(
    `[prepare-db] Refusing to continue: ${source} asks for "${requested}" but DATABASE_URL is a "${fromUrl}" URL.`,
  );
  console.error(
    "[prepare-db] Fix DATABASE_URL, or unset the override so the provider can follow the URL.",
  );
  process.exit(1);
}

const source = fromFlag ? "flag" : fromProviderVar ? "DATABASE_PROVIDER" : "DATABASE_URL";
const schema = readFileSync(SCHEMA_PATH, "utf8");
const match = schema.match(PATTERN);

if (!match) {
  console.error(
    "[prepare-db] Could not find the datasource provider in prisma/schema.prisma",
  );
  process.exit(1);
}

if (match[2] === requested) {
  console.log(`[prepare-db] provider "${requested}" already set (via ${source}).`);
  process.exit(0);
}

writeFileSync(SCHEMA_PATH, schema.replace(PATTERN, `$1"${requested}"`), "utf8");
console.log(`[prepare-db] provider set to "${requested}" (via ${source}).`);
