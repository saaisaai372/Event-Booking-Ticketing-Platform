import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Role } from "@/types";

const accessKey = () => new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(accessKey());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessKey());
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Opaque, high-entropy token (refresh tokens + email links). Never stored raw. */
export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

/** Deterministic hash so tokens can be looked up without storing the secret. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newReference(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
