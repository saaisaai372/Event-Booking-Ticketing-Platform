import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { UsersTable } from "@/features/admin/components/users-table";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin/users");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage roles, approve organizer access and suspend accounts.
        </p>
      </header>
      <UsersTable currentUserId={user.id} />
    </div>
  );
}
