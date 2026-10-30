import type { Metadata } from "next";
import { CheckoutPanel } from "@/features/bookings/components/checkout-panel";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the mock payment to confirm your booking and receive QR tickets.
        </p>
      </header>
      <CheckoutPanel bookingId={id} />
    </div>
  );
}
