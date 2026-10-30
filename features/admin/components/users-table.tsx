"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserX } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizerStatus: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { events: number; bookings: number };
}

export function UsersTable({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-users", term],
    queryFn: () =>
      apiFetch<{ users: AdminUser[] }>(
        term ? `/api/admin/users?search=${encodeURIComponent(term)}` : "/api/admin/users",
      ),
  });

  const users = data?.users ?? [];

  async function patch(user: AdminUser, body: Record<string, unknown>, message: string) {
    setBusyId(user.id);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "PATCH", body });
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not update the user.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setTerm(search.trim());
        }}
      >
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" title="Could not load users">
          {error instanceof Error ? error.message : "Please try again."}
        </Alert>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No users found"
          description="Try a different search."
        />
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.id === currentUserId ? (
                        <Badge variant="outline">You</Badge>
                      ) : null}
                      {!user.isActive ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : null}
                      {!user.emailVerified ? (
                        <Badge variant="warning">Unverified</Badge>
                      ) : null}
                      {user.organizerStatus === "PENDING" ? (
                        <Badge variant="warning">Organizer request</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.createdAt)} · {user._count.events} events ·{" "}
                      {user._count.bookings} bookings
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      aria-label={`Role for ${user.name}`}
                      value={user.role}
                      disabled={busyId === user.id}
                      className="h-9 w-36"
                      onChange={(event) =>
                        patch(user, { role: event.target.value }, "Role updated")
                      }
                    >
                      <option value="ATTENDEE">Attendee</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="ADMIN">Admin</option>
                    </Select>

                    {user.organizerStatus === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busyId === user.id}
                          onClick={() =>
                            patch(
                              user,
                              { organizerStatus: "APPROVED", role: "ORGANIZER" },
                              "Organizer approved",
                            )
                          }
                        >
                          Approve organizer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={busyId === user.id}
                          onClick={() =>
                            patch(
                              user,
                              { organizerStatus: "REJECTED" },
                              "Organizer request declined",
                            )
                          }
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === user.id || user.id === currentUserId}
                      onClick={() =>
                        patch(
                          user,
                          { isActive: !user.isActive },
                          user.isActive ? "User suspended" : "User reactivated",
                        )
                      }
                    >
                      {user.isActive ? "Suspend" : "Reactivate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
