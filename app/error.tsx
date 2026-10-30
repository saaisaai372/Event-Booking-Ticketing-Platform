"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to the console for local debugging; swap for a logger/reporter in production.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can try again — if it
        keeps happening, please come back later.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
