"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role, SessionUser } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Browse",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/events", label: "Explore events", icon: Compass },
    ],
  },
  {
    section: "My activity",
    items: [
      { href: "/bookings", label: "My bookings", icon: Ticket },
      { href: "/tickets", label: "My tickets", icon: Ticket },
      { href: "/saved", label: "Saved events", icon: Bookmark },
      { href: "/profile", label: "Profile", icon: UserIcon },
    ],
  },
  {
    section: "Organizer",
    items: [
      {
        href: "/organizer/events",
        label: "My events",
        icon: CalendarDays,
        roles: ["ORGANIZER", "ADMIN"],
      },
      {
        href: "/organizer/events/new",
        label: "Create event",
        icon: CalendarPlus,
        roles: ["ORGANIZER", "ADMIN"],
      },
      {
        href: "/organizer/check-in",
        label: "Check-in scanner",
        icon: ClipboardCheck,
        roles: ["ORGANIZER", "ADMIN"],
      },
      {
        href: "/organizer/analytics",
        label: "Analytics",
        icon: BarChart3,
        roles: ["ORGANIZER", "ADMIN"],
      },
    ],
  },
  {
    section: "Administration",
    items: [
      {
        href: "/admin/events",
        label: "Event approvals",
        icon: ShieldCheck,
        roles: ["ADMIN"],
      },
      { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
      {
        href: "/admin/stats",
        label: "Platform stats",
        icon: BarChart3,
        roles: ["ADMIN"],
      },
    ],
  },
];

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const sections = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(user.role)),
  })).filter((section) => section.items.length > 0);

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarDays className="size-4" />
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.section}>
            <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.section}
            </p>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 px-2">
          <Avatar name={user.name} src={user.avatarUrl} className="size-8" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-background">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-lg border border-border"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <span className="text-sm font-semibold">{APP_NAME}</span>
          <ThemeToggle />
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
