import { Suspense } from "react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventsBrowser } from "@/features/events/components/events-browser";

export const metadata: Metadata = {
  title: "Explore events",
  description: "Search and filter events by category, city, date and price.",
};

function BrowserFallback() {
  return (
    <div className="container-page py-8">
      <Skeleton className="h-9 w-56" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="aspect-[16/9] rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<BrowserFallback />}>
      <EventsBrowser />
    </Suspense>
  );
}
