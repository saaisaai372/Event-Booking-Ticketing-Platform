import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/features/admin/admin.service";
import { ok, route } from "@/lib/http";

export const GET = route(async (request: Request) => {
  await requireRole("ADMIN");
  const search = new URL(request.url).searchParams.get("search") ?? undefined;
  const users = await listUsers(search || undefined);
  return ok({ users });
});
