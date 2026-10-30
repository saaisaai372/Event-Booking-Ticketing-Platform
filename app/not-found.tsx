import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page may have been moved, or the event you&apos;re looking for is no longer
        published.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button>
            <Home />
            Go home
          </Button>
        </Link>
        <Link href="/events">
          <Button variant="outline">
            <Compass />
            Explore events
          </Button>
        </Link>
      </div>
    </div>
  );
}
