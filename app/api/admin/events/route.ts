import { requireRole } from "@/lib/auth/session";
import { listEventsForReview } from "@/features/admin/admin.service";
import { ok, route } from "@/lib/http";

export const GET = route(async (request: Request) => {
  await requireRole("ADMIN");
  const status = new URL(request.url).searchParams.get("status") ?? "PENDING";
  const events = await listEventsForReview(status.toUpperCase());
  return ok({ events, status: status.toUpperCase() });
});
