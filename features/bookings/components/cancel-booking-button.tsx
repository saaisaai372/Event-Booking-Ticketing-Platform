"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiError, apiFetch } from "@/lib/api-client";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      await apiFetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
      toast.success("Booking cancelled");
      setOpen(false);
      router.refresh();
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not cancel booking.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
      <ConfirmDialog
        open={open}
        title="Cancel this booking?"
        description="Your seats will be released and the tickets voided. This cannot be undone."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        destructive
        busy={busy}
        onConfirm={cancel}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
