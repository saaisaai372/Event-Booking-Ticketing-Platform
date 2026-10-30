import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { EventCard } from "@/features/events/components/event-card";
import { eventCardInclude, toEventCard } from "@/features/events/types";

export const metadata: Metadata = { title: "Saved events" };

export default async function SavedEventsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");

  const saved = await prisma.savedEvent.findMany({
    where: { userId: user.id },
    include: { event: { include: eventCardInclude } },
    orderBy: { createdAt: "desc" },
  });

  const events = saved
    .filter((row) => row.event.status === "APPROVED")
    .map((row) => toEventCard(row.event));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Saved events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Events you bookmarked.{" "}
          <Link href="/events" className="text-primary hover:underline">
            Browse more →
          </Link>
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap “Save event” on any event page to keep it here."
          actionLabel="Explore events"
          actionHref="/events"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
