import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/features/dashboard/dashboard.service";
import { ok, route } from "@/lib/http";

export const GET = route(async () => {
  const user = await requireUser();
  const dashboard = await getDashboard(user);
  return ok({ dashboard });
});
