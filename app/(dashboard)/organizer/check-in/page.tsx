import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { CheckInPanel } from "@/features/organizer/components/check-in-panel";

export const metadata: Metadata = { title: "Check-in scanner" };

export default async function CheckInPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/organizer/check-in");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/profile");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Door check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Validate attendee QR tickets. Each ticket can only be checked in once.
        </p>
      </header>
      <CheckInPanel />
    </div>
  );
}
