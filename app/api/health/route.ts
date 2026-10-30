import { ok, route } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/** Liveness + database connectivity probe used by deployment platforms. */
export const GET = route(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return ok({ status: "ok", timestamp: new Date().toISOString() });
});
