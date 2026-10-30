import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BadgeIndianRupee, CheckCircle2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSessionUser } from "@/lib/auth/session";
import { listOrganizerEvents } from "@/features/events/organizer.service";
import { getEventStats } from "@/features/tickets/ticket.service";
import { revenueTrend } from "@/features/admin/admin.service";
import { RevenueTrendChart } from "@/features/dashboard/components/charts";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function OrganizerAnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/organizer/analytics");
  if (user.role !== "ORGANIZER" && user.role !== "ADMIN") redirect("/profile");

  const events = await listOrganizerEvents(user.id);
  const perEvent = await Promise.all(
    events.map(async (event) => ({ event, stats: await getEventStats(event.id) })),
  );

  const totals = perEvent.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.stats.revenue,
      ticketsSold: sum.ticketsSold + row.stats.ticketsSold,
      checkedIn: sum.checkedIn + row.stats.checkedIn,
    }),
    { revenue: 0, ticketsSold: 0, checkedIn: 0 },
  );

  const trend = await revenueTrend(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sales and attendance across your events.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total revenue"
          value={formatMoney(totals.revenue)}
          icon={BadgeIndianRupee}
          accent="success"
        />
        <StatCard label="Tickets sold" value={totals.ticketsSold} icon={Ticket} />
        <StatCard
          label="Checked in"
          value={totals.checkedIn}
          icon={CheckCircle2}
          accent="chart-2"
        />
      </div>

      <RevenueTrendChart data={trend} />

      {perEvent.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No events to analyse yet"
          description="Create an event and it will appear here."
          actionLabel="Create event"
          actionHref="/organizer/events/new"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-event breakdown</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-140 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pr-4 pb-2 font-medium">Event</th>
                  <th className="pr-4 pb-2 font-medium">Status</th>
                  <th className="pr-4 pb-2 font-medium">Starts</th>
                  <th className="pr-4 pb-2 text-right font-medium">Sold</th>
                  <th className="pr-4 pb-2 text-right font-medium">Checked in</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {perEvent.map(({ event, stats }) => (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {event.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatDateTime(event.startAt)}
                    </td>
                    <td className="py-3 pr-4 text-right">{stats.ticketsSold}</td>
                    <td className="py-3 pr-4 text-right">{stats.checkedIn}</td>
                    <td className="py-3 text-right font-medium">
                      {formatMoney(stats.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <Link href="/organizer/events">
                <Button variant="outline" size="sm">
                  Manage events
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
