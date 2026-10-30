import { randomInt } from "node:crypto";
import type { User } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { toSessionUser } from "@/lib/auth/session";
import { createOpaqueToken, hashToken, signAccessToken } from "@/lib/auth/tokens";
import { env } from "@/lib/env";
import { AppError, Errors } from "@/lib/http";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import { sendOtpEmail } from "./email";

const OTP_TTL_MINUTES = 15;

/**
 * In non-production we surface the OTP so the flow can be completed without a
 * mail server. Never returned in production.
 */
function withDevCode<T extends object>(payload: T, code: string) {
  return env.NODE_ENV === "production" ? payload : { ...payload, devCode: code };
}

export interface AuthSession {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

/** Session plus the dev-only OTP echo (never present in production). */
export type AuthSessionWithDevCode = AuthSession & { devCode?: string };

async function issueSession(user: User, userAgent?: string | null): Promise<AuthSession> {
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role as SessionUser["role"],
    email: user.email,
  });

  const refreshToken = createOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
      userAgent: userAgent ?? null,
    },
  });

  return { user: toSessionUser(user), accessToken, refreshToken };
}

async function issueOtp(userId: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  // Only the newest code should be valid.
  await prisma.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });
  return code;
}

async function consumeOtp(
  userId: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
  code: string,
) {
  const record = await prisma.verificationToken.findFirst({
    where: { userId, type, tokenHash: hashToken(code), usedAt: null },
  });

  if (!record || record.expiresAt < new Date()) {
    throw Errors.badRequest("That code is invalid or has expired.");
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
}

export async function registerUser(
  input: { name: string; email: string; password: string },
  userAgent?: string | null,
): Promise<AuthSessionWithDevCode> {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Errors.conflict("An account with that email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      passwordHash: await hashPassword(input.password),
      role: "ATTENDEE",
      emailVerified: false,
    },
  });

  const code = await issueOtp(user.id, "EMAIL_VERIFICATION");
  await sendOtpEmail(user.email, code, "verify");

  const session = await issueSession(user, userAgent);
  return withDevCode(session, code);
}

export async function loginUser(
  input: { email: string; password: string },
  userAgent?: string | null,
) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  // Same message + a dummy compare keeps the failure path constant-time-ish.
  if (!user) {
    await hashPassword(input.password);
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }
  if (!user.isActive) {
    throw Errors.forbidden("This account has been suspended. Contact support.");
  }

  return issueSession(user, userAgent);
}

/** Rotate a refresh token, revoking the old one (single-use refresh tokens). */
export async function rotateRefreshToken(
  token: string,
  userAgent?: string | null,
): Promise<AuthSession> {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !record ||
    record.revokedAt ||
    record.expiresAt < new Date() ||
    !record.user.isActive
  ) {
    throw Errors.unauthorized("Your session has expired. Please sign in again.");
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  logger.debug("Rotated refresh token", { userId: record.userId });
  return issueSession(record.user, userAgent);
}

export async function logoutUser(token?: string | null) {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always behave the same way so the endpoint cannot be used to enumerate users.
  if (!user || !user.isActive) return { sent: true };

  const code = await issueOtp(user.id, "PASSWORD_RESET");
  await sendOtpEmail(user.email, code, "reset");
  return withDevCode({ sent: true }, code);
}

export async function resetPassword(input: {
  email: string;
  code: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (!user) throw Errors.badRequest("That code is invalid or has expired.");

  await consumeOtp(user.id, "PASSWORD_RESET", input.code);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(input.password),
      emailVerified: true,
    },
  });

  // Force re-authentication everywhere after a password change.
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { reset: true };
}

export async function verifyEmail(input: { email: string; code: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (!user) throw Errors.badRequest("That code is invalid or has expired.");
  if (user.emailVerified) return { verified: true };

  await consumeOtp(user.id, "EMAIL_VERIFICATION", input.code);
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { verified: true };
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound("Account not found.");
  if (user.emailVerified) return { sent: false, alreadyVerified: true };

  const code = await issueOtp(user.id, "EMAIL_VERIFICATION");
  await sendOtpEmail(user.email, code, "verify");
  return { sent: true, alreadyVerified: false };
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) throw Errors.badRequest("Your current password is incorrect.");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });

  return { updated: true };
}
