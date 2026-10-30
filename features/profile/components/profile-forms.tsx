"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
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
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/features/auth/auth.schema";
import type { SessionUser } from "@/types";

export function ProfileForms({ user }: { user: SessionUser }) {
  return (
    <div className="space-y-6">
      <ProfileDetails user={user} />
      <PasswordForm />
      <OrganizerRequest user={user} />
    </div>
  );
}

function ProfileDetails({ user }: { user: SessionUser }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      phone: "",
      bio: "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const avatarUrl = useWatch({ control, name: "avatarUrl" });

  async function onSubmit(values: UpdateProfileInput) {
    try {
      await authApi.updateProfile(values);
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not update profile.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your details</CardTitle>
        <CardDescription>
          Update how you appear to organizers and attendees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="flex items-center gap-4">
            <Avatar
              name={user.name}
              src={avatarUrl || user.avatarUrl}
              className="size-16 text-lg"
            />
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="avatarUrl">Avatar image URL</Label>
              <Input
                id="avatarUrl"
                placeholder="https://…"
                aria-invalid={Boolean(errors.avatarUrl)}
                {...register("avatarUrl")}
              />
              <FieldError message={errors.avatarUrl?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 …" {...register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={3}
              placeholder="A short introduction…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              {...register("bio")}
            />
            <FieldError message={errors.bio?.message} />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              Save changes
            </Button>
            <span className="text-xs text-muted-foreground">
              Signed in as {user.email}
              {user.emailVerified ? " · verified" : " · email not verified"}
            </span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await authApi.changePassword(values);
      toast.success("Password updated");
      reset();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not change password.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Choose a new password with at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.currentPassword)}
                {...register("currentPassword")}
              />
              <FieldError message={errors.currentPassword?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                {...register("newPassword")}
              />
              <FieldError message={errors.newPassword?.message} />
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : null}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function OrganizerRequest({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    try {
      await authApi.requestOrganizer();
      toast.success("Request sent — an admin will review it shortly.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send request.");
    } finally {
      setBusy(false);
    }
  }

  if (user.role === "ORGANIZER" || user.role === "ADMIN") {
    return (
      <Alert variant="success" title="You can create events">
        Your account already has organizer access.
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Become an organizer</CardTitle>
        <CardDescription>
          Request access to create and sell tickets for your own events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user.organizerStatus === "PENDING" ? (
          <Alert variant="warning" title="Request pending">
            An admin is reviewing your request.
          </Alert>
        ) : user.organizerStatus === "REJECTED" ? (
          <Alert variant="destructive" title="Previous request declined">
            You can request again if your circumstances have changed.
          </Alert>
        ) : null}

        <Button onClick={request} disabled={busy || user.organizerStatus === "PENDING"}>
          {busy ? <Spinner /> : null}
          {user.organizerStatus === "PENDING"
            ? "Request pending"
            : "Request organizer access"}
        </Button>
      </CardContent>
    </Card>
  );
}
