import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/types";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./auth.schema";

export const authApi = {
  login: (input: LoginInput) =>
    apiFetch<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: input }),

  register: (input: RegisterInput) =>
    apiFetch<{ user: SessionUser; devCode?: string }>("/api/auth/register", {
      method: "POST",
      body: input,
    }),

  logout: () => apiFetch<{ signedOut: boolean }>("/api/auth/logout", { method: "POST" }),

  refresh: () =>
    apiFetch<{ user: SessionUser | null }>("/api/auth/refresh", { method: "POST" }),

  me: () => apiFetch<{ user: SessionUser | null }>("/api/auth/me"),

  forgotPassword: (input: ForgotPasswordInput) =>
    apiFetch<{ sent: boolean; devCode?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: input,
    }),

  resetPassword: (input: ResetPasswordInput) =>
    apiFetch<{ reset: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: input,
    }),

  verifyEmail: (input: { email: string; code: string }) =>
    apiFetch<{ verified: boolean }>("/api/auth/verify-email", {
      method: "POST",
      body: input,
    }),

  resendVerification: () =>
    apiFetch<{ sent: boolean; alreadyVerified: boolean }>(
      "/api/auth/resend-verification",
      { method: "POST" },
    ),

  updateProfile: (input: UpdateProfileInput) =>
    apiFetch<{ user: SessionUser }>("/api/profile", { method: "PATCH", body: input }),

  changePassword: (input: ChangePasswordInput) =>
    apiFetch<{ updated: boolean }>("/api/profile/password", {
      method: "POST",
      body: input,
    }),

  requestOrganizer: () =>
    apiFetch<{ requested: boolean }>("/api/profile/organizer-request", {
      method: "POST",
    }),
};
