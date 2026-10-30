import type { Metadata } from "next";
import { EventApprovals } from "@/features/admin/components/event-approvals";

export const metadata: Metadata = { title: "Event approvals" };

export default function AdminEventsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Event approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review organizer submissions before they go live.
        </p>
      </header>
      <EventApprovals />
    </div>
  );
}
