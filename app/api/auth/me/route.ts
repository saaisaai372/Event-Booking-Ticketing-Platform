import { getSessionUser } from "@/lib/auth/session";
import { ok, route } from "@/lib/http";

export const GET = route(async () => {
  const user = await getSessionUser();
  return ok({ user });
});
