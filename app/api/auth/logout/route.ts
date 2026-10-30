import { clearAuthCookies, getRefreshToken } from "@/lib/auth/cookies";
import { logoutUser } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async () => {
  await logoutUser(await getRefreshToken());
  await clearAuthCookies();
  return ok({ signedOut: true });
});
