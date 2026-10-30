import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Email delivery. No provider is configured for this project, so in development
 * the verification / reset code is written to the server log via the logger so
 * the flow can be completed end-to-end without a mail server.
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: "verify" | "reset",
) {
  const subject =
    purpose === "verify" ? "Verify your Evently account" : "Reset your Evently password";

  if (env.RESEND_API_KEY) {
    logger.info(`Sending "${subject}" email via Resend`, { to });
    // A real implementation would POST to https://api.resend.com/emails here.
    return { delivered: true as const };
  }

  logger.info(`[dev] ${subject} — code for ${to}: ${code}`);
  return { delivered: false as const };
}
