import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/stat-card";
import { getSessionUser } from "@/lib/auth/session";
import {
  getAttendeeDashboard,
  getOrganizerDashboard,
  type AttendeeDashboard,
  type OrganizerDashboard,
} from "@/features/dashboard/dashboard.service";
import { platformStats } from "@/features/admin/admin.service";
import {
  CategoryBarChart,
  RevenueTrendChart,
} from "@/features/dashboard/components/charts";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  if (user.role === "ADMIN") {
    const stats = await platformStats();
    return (
      <Page
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle="Platform overview and moderation queue."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Users"
            value={stats.users}
            hint={`${stats.organizers} organizers`}
            icon={Users}
          />
          <StatCard
            label="Events"
            value={stats.events}
            hint={`${stats.approvedEvents} live`}
            icon={CalendarDays}
          />
          <StatCard
            label="Pending approvals"
            value={stats.pendingEvents}
            icon={CheckCircle2}
            accent="warning"
          />
          <StatCard
            label="Gross revenue"
            value={formatMoney(stats.revenue)}
            icon={BadgeIndianRupee}
            accent="success"
          />
        </div>

        {stats.pendingEvents > 0 ? (
          <Alert variant="warning" title={`${stats.pendingEvents} event(s) need review`}>
            <Link href="/admin/events" className="text-primary hover:underline">
              Review the approval queue →
            </Link>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryBarChart data={stats.byCategory} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Confirmed bookings" value={stats.confirmedBookings} />
              <Row label="Tickets issued" value={stats.tickets} />
              <Row label="Tickets checked in" value={stats.checkedIn} />
              <Link href="/admin/users" className="inline-flex">
                <Button variant="outline" size="sm">
                  Manage users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Page>
    );
  }

  if (user.role === "ORGANIZER") {
    const data = await getOrganizerDashboard(user.id);
    return (
      <Page
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle="Your events, sales and check-ins."
        action={
          <Link href="/organizer/events/new" className="inline-flex">
            <Button>
              <CalendarPlus />
              Create event
            </Button>
          </Link>
        }
      >
        <OrganizerView data={data} />
      </Page>
    );
  }

  const data = await getAttendeeDashboard(user.id);
  return (
    <Page
      title={`Welcome back, ${user.name.split(" ")[0]}`}
      subtitle="Your bookings and tickets at a glance."
    >
      <AttendeeView data={data} />
    </Page>
  );
}

function Page({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AttendeeView({ data }: { data: AttendeeDashboard }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming bookings"
          value={data.upcomingBookings}
          icon={CalendarDays}
        />
        <StatCard
          label="Valid tickets"
          value={data.ticketsHeld}
          icon={Ticket}
          accent="success"
        />
        <StatCard
          label="Total spent"
          value={formatMoney(data.totalSpent)}
          icon={BadgeIndianRupee}
          accent="chart-2"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next event</CardTitle>
          </CardHeader>
          <CardContent>
            {data.nextEvent ? (
              <div className="space-y-1">
                <Link
                  href={`/events/${data.nextEvent.slug}`}
                  className="font-semibold hover:text-primary"
                >
                  {data.nextEvent.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(data.nextEvent.startAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming events booked yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="min-w-0 truncate hover:text-primary"
                    >
                      {booking.eventTitle}
                    </Link>
                    <span className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <span className="text-muted-foreground">
                        {formatMoney(booking.total)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {data.upcomingBookings === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No upcoming bookings"
          description="Explore events and book your first ticket."
          actionLabel="Explore events"
          actionHref="/events"
        />
      ) : null}
    </>
  );
}

function OrganizerView({ data }: { data: OrganizerDashboard }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatMoney(data.revenue)}
          icon={BadgeIndianRupee}
          accent="success"
        />
        <StatCard label="Tickets sold" value={data.ticketsSold} icon={Ticket} />
        <StatCard
          label="Checked in"
          value={data.checkedIn}
          icon={ClipboardCheck}
          accent="chart-2"
        />
        <StatCard
          label="Events"
          value={data.events}
          hint={`${data.publishedEvents} live · ${data.pendingEvents} pending`}
          icon={CalendarDays}
          accent="warning"
        />
      </div>

      {data.pendingEvents > 0 ? (
        <Alert
          variant="warning"
          title={`${data.pendingEvents} event(s) awaiting approval`}
        >
          An admin needs to approve your submission before it goes live.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={data.trend} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/organizer/events">
              <Button variant="outline">My events</Button>
            </Link>
            <Link href="/organizer/check-in">
              <Button variant="outline">Check-in scanner</Button>
            </Link>
            <Link href="/organizer/analytics">
              <Button variant="outline">Analytics</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
