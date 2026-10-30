import { requireRole } from "@/lib/auth/session";
import { platformStats, revenueTrend } from "@/features/admin/admin.service";
import { ok, route } from "@/lib/http";

export const GET = route(async () => {
  await requireRole("ADMIN");
  const [stats, trend] = await Promise.all([platformStats(), revenueTrend()]);
  return ok({ stats, trend });
});
