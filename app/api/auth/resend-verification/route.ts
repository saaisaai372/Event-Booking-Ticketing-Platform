import { requireUser } from "@/lib/auth/session";
import { resendVerification } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async () => {
  const user = await requireUser();
  const result = await resendVerification(user.id);
  return ok(result);
});
