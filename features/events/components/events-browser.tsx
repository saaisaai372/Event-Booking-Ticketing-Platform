"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarX2, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { EventCard } from "@/features/events/components/event-card";
import type { EventCardData } from "@/features/events/types";
import { apiFetch } from "@/lib/api-client";
import { CATEGORIES, CITIES, SORT_OPTIONS } from "@/lib/constants";
import type { Paginated } from "@/types";

const ANY = "__any__";

export function EventsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");

  const queryString = searchParams.toString();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["events", queryString],
    queryFn: () => apiFetch<Paginated<EventCardData>>(`/api/events?${queryString}`),
  });

  const activeFilters = useMemo(
    () =>
      ["category", "city", "dateFrom", "maxPrice", "sort"].filter((key) =>
        searchParams.get(key),
      ).length,
    [searchParams],
  );

  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === ANY) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in changes)) next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParams({ search: searchText.trim() || null });
  }

  const events = data?.items ?? [];
  const hasFilters = queryString.length > 0;

  return (
    <div className="container-page py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.total} event${data.total === 1 ? "" : "s"} found`
              : "Searching…"}
            {isFetching && data ? " · updating" : ""}
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search events…"
              aria-label="Search events"
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Toggle filters"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal />
          </Button>
        </form>
      </header>

      <div
        className={
          showFilters ? "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" : "hidden"
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={searchParams.get("category") ?? ANY}
            onChange={(event) => updateParams({ category: event.target.value })}
          >
            <option value={ANY}>All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Select
            id="city"
            value={searchParams.get("city") ?? ANY}
            onChange={(event) => updateParams({ city: event.target.value })}
          >
            <option value={ANY}>All cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(event) => updateParams({ dateFrom: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">Max price (₹)</Label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Any"
            value={searchParams.get("maxPrice") ?? ""}
            onChange={(event) => updateParams({ maxPrice: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sort">Sort by</Label>
          <Select
            id="sort"
            value={searchParams.get("sort") ?? "date_asc"}
            onChange={(event) => updateParams({ sort: event.target.value })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={!hasFilters}
            onClick={() => {
              setSearchText("");
              router.push(pathname);
            }}
          >
            Clear filters {activeFilters > 0 ? `(${activeFilters})` : ""}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="aspect-[16/9] rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Alert variant="destructive" title="Could not load events">
            <p>{error instanceof Error ? error.message : "Please try again."}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </Alert>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No events match your filters"
            description="Try clearing the filters or searching for something else."
            actionLabel="Clear filters"
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

      {data && data.totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => updateParams({ page: String(data.page - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() => updateParams({ page: String(data.page + 1) })}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
