import { clearAuthCookies, getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { rotateRefreshToken } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

/** Exchanges the refresh-token cookie for a fresh access + refresh pair. */
export const POST = route(async (request: Request) => {
  const token = await getRefreshToken();
  if (!token) {
    await clearAuthCookies();
    return ok({ user: null });
  }

  const session = await rotateRefreshToken(token, request.headers.get("user-agent"));
  await setAuthCookies(session.accessToken, session.refreshToken);
  return ok({ user: session.user });
});
