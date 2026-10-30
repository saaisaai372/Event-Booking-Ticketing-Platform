import { requireUser } from "@/lib/auth/session";
import { requestOrganizerAccess } from "@/features/profile/profile.service";
import { ok, route } from "@/lib/http";

export const POST = route(async () => {
  const session = await requireUser();
  const result = await requestOrganizerAccess(session.id);
  return ok(result);
});
