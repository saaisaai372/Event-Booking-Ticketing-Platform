import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, BadgeIndianRupee, CheckCircle2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSessionUser } from "@/lib/auth/session";
import { getOrganizerEvent } from "@/features/events/organizer.service";
import { getEventStats, listEventAttendees } from "@/features/tickets/ticket.service";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage event" };

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/organizer/events");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/profile");

  const { id } = await params;

  let event;
  try {
    event = await getOrganizerEvent(id, user.id, user.role === "ADMIN");
  } catch {
    notFound();
  }

  const [stats, attendees] = await Promise.all([
    getEventStats(event.id),
    listEventAttendees(event.id, user.id, user.role === "ADMIN"),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/organizer/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to my events
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            {event.title}
            <StatusBadge status={event.status} />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(event.startAt)} ·{" "}
            {event.isOnline ? "Online" : (event.venueName ?? event.city ?? "Venue TBA")}
          </p>
        </div>
        <Link href={`/events/${event.slug}`} className="inline-flex">
          <Button variant="outline">View public page</Button>
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Revenue"
          value={formatMoney(stats.revenue)}
          icon={BadgeIndianRupee}
          accent="success"
        />
        <StatCard label="Tickets sold" value={stats.ticketsSold} icon={Ticket} />
        <StatCard
          label="Checked in"
          value={stats.checkedIn}
          icon={CheckCircle2}
          accent="chart-2"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket types</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-100 text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="pr-4 pb-2 font-medium">Name</th>
                <th className="pr-4 pb-2 text-right font-medium">Price</th>
                <th className="pr-4 pb-2 text-right font-medium">Sold</th>
                <th className="pb-2 text-right font-medium">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {event.ticketTypes.map((type) => (
                <tr key={type.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">{type.name}</td>
                  <td className="py-2 pr-4 text-right">{formatMoney(type.price)}</td>
                  <td className="py-2 pr-4 text-right">{type.sold}</td>
                  <td className="py-2 text-right">{type.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendees ({attendees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No attendees yet"
              description="Tickets sold will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {attendees.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{ticket.user.name}</p>
                    <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {ticket.ticketType.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {ticket.code}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
