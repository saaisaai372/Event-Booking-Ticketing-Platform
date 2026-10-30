#!/usr/bin/env node
/**
 * Fail the build when the generated Prisma client cannot read DATABASE_URL.
 *
 * A provider/URL mismatch previously surfaced *after* deployment as a runtime
 * error while Next.js still reported a successful build. Instantiating the client
 * validates the datasource eagerly, so this turns a silent breakage into a failed
 * build with an actionable message.
 *
 * Runs between `prisma generate` and `next build`.
 */
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile?.();
  } catch {
    // ignore — handled below
  }
}

const url = (process.env.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");

if (!url) {
  console.error("[check-db] DATABASE_URL is not set. Add it to the host's environment.");
  process.exit(1);
}

const scheme = url.split("://")[0].toLowerCase();

try {
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient();
  await client.$disconnect();
  console.log(`[check-db] Prisma client initialised for a "${scheme}" datasource.`);
} catch (error) {
  console.error(
    `[check-db] The generated Prisma client cannot read DATABASE_URL ("${scheme}://…").`,
  );
  console.error(`[check-db] ${error instanceof Error ? error.message : String(error)}`);
  console.error(
    "[check-db] This usually means the schema provider does not match the URL. Re-run the build without cache.",
  );
  process.exit(1);
}
