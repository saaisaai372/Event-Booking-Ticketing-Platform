import { describe, expect, it } from "vitest";
import { registerSchema } from "@/features/auth/auth.schema";

describe("registerSchema", () => {
  const base = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Password1",
    acceptTerms: true,
  };

  it("accepts a well-formed registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = registerSchema.parse({ ...base, email: "  ADA@Example.COM " });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({ ...base, password: "passwordonly" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("requires accepting the terms", () => {
    const result = registerSchema.safeParse({ ...base, acceptTerms: false });
    expect(result.success).toBe(false);
  });
});
