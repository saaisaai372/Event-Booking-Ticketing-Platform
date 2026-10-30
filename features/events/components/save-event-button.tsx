"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function SaveEventButton({
  slug,
  initialSaved,
  isAuthenticated,
}: {
  slug: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
      return;
    }
    setBusy(true);
    try {
      const result = await apiFetch<{ saved: boolean }>(`/api/events/${slug}/save`, {
        method: "POST",
      });
      setSaved(result.saved);
      toast.success(result.saved ? "Saved to your list" : "Removed from saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not update saved events.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" className="w-full" onClick={toggle} disabled={busy}>
      <Bookmark className={cn(saved && "fill-current text-primary")} />
      {saved ? "Saved" : "Save event"}
    </Button>
  );
}
