import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookie-names";

export { ACCESS_COOKIE, REFRESH_COOKIE };

function baseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
  };
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    ...baseOptions(),
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}
