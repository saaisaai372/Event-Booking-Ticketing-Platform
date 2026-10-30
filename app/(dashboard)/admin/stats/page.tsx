import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  CalendarDays,
  ClipboardCheck,
  Ticket,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { getSessionUser } from "@/lib/auth/session";
import { platformStats, revenueTrend } from "@/features/admin/admin.service";
import {
  CategoryBarChart,
  RevenueTrendChart,
} from "@/features/dashboard/components/charts";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Platform stats" };

export default async function AdminStatsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin/stats");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [stats, trend] = await Promise.all([platformStats(), revenueTrend()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Platform stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live totals across the whole platform.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatMoney(stats.revenue)}
          icon={BadgeIndianRupee}
          accent="success"
        />
        <StatCard
          label="Confirmed bookings"
          value={stats.confirmedBookings}
          icon={Ticket}
        />
        <StatCard
          label="Tickets issued"
          value={stats.tickets}
          hint={`${stats.checkedIn} checked in`}
          icon={ClipboardCheck}
          accent="chart-2"
        />
        <StatCard
          label="Events"
          value={stats.events}
          hint={`${stats.approvedEvents} live · ${stats.pendingEvents} pending`}
          icon={CalendarDays}
          accent="warning"
        />
        <StatCard
          label="Users"
          value={stats.users}
          hint={`${stats.organizers} organizers`}
          icon={Users}
        />
        <StatCard
          label="All bookings"
          value={stats.bookings}
          icon={Ticket}
          accent="chart-2"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={trend} />
        <CategoryBarChart data={stats.byCategory} />
      </div>
    </div>
  );
}
