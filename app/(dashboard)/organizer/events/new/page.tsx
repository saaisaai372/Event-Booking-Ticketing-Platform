import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { OrganizerEventForm } from "@/features/organizer/components/organizer-event-form";

export const metadata: Metadata = { title: "Create event" };

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/organizer/events/new");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/profile");

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details and submit it for admin approval before it goes live.
        </p>
      </header>
      <OrganizerEventForm categories={categories} />
    </div>
  );
}
