import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { OrganizerEventsList } from "@/features/organizer/components/organizer-events-list";

export const metadata: Metadata = { title: "My events" };

export default function OrganizerEventsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage drafts, submissions and live events.
          </p>
        </div>
        <Link href="/organizer/events/new" className="inline-flex">
          <Button>Create event</Button>
        </Link>
      </header>
      <OrganizerEventsList />
    </div>
  );
}
