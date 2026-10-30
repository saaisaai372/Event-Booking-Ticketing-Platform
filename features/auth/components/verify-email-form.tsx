"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { authApi } from "@/features/auth/auth.api";
import { otpSchema } from "@/features/auth/auth.schema";

type VerifyInput = { email: string; code: string };

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: searchParams.get("email") ?? "", code: "" },
  });

  async function onSubmit(values: VerifyInput) {
    setFormError(null);
    try {
      await authApi.verifyEmail(values);
      toast.success("Email verified!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Try again.",
      );
    }
  }

  async function resend() {
    setResending(true);
    try {
      const result = await authApi.resendVerification();
      if (result.alreadyVerified) toast.success("Your email is already verified.");
      else toast.success("A new code has been sent.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not resend the code.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code we sent to {getValues("email") || "your inbox"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {formError ? <Alert variant="destructive">{formError}</Alert> : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="code">Verification code</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="tracking-[0.4em]"
              aria-invalid={Boolean(errors.code)}
              {...register("code")}
            />
            <FieldError message={errors.code?.message} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            {isSubmitting ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Skip for now
          </Link>
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
