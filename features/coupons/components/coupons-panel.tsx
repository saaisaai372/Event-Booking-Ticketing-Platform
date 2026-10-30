"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api-client";
import { couponApi, type CouponView } from "@/features/coupons/coupon.api";
import { formatDate, formatMoney } from "@/lib/utils";

function describe(coupon: CouponView) {
  return coupon.discountType === "PERCENT"
    ? `${coupon.discountValue}% off`
    : `${formatMoney(coupon.discountValue)} off`;
}

export function CouponsPanel({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CouponView | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["coupons", eventId],
    queryFn: () => couponApi.listForEvent(eventId),
  });

  const coupons = data?.coupons ?? [];

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);

    if (code.trim().length < 3) {
      setFieldError("Codes need at least 3 characters.");
      return;
    }
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setFieldError("Enter a discount greater than zero.");
      return;
    }
    if (discountType === "PERCENT" && value > 100) {
      setFieldError("A percentage discount cannot exceed 100.");
      return;
    }

    setCreating(true);
    try {
      await couponApi.create(eventId, {
        code: code.trim(),
        discountType,
        discountValue: value,
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresAt: expiresAt || undefined,
        isActive: true,
      });
      toast.success(`Coupon ${code.trim().toUpperCase()} created`);
      setCode("");
      setMaxUses("");
      setExpiresAt("");
      await queryClient.invalidateQueries({ queryKey: ["coupons", eventId] });
    } catch (caught) {
      setFieldError(
        caught instanceof ApiError ? caught.message : "Could not create the coupon.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function toggle(coupon: CouponView) {
    setBusyId(coupon.id);
    try {
      await couponApi.setActive(coupon.id, !coupon.isActive);
      toast.success(coupon.isActive ? "Coupon paused" : "Coupon activated");
      await queryClient.invalidateQueries({ queryKey: ["coupons", eventId] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not update the coupon.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await couponApi.remove(pendingDelete.id);
      toast.success("Coupon deleted");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["coupons", eventId] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not delete the coupon.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="size-4 text-primary" />
          Coupons
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Code</Label>
            <Input
              id="coupon-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="EARLYBIRD"
              className="uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-type">Type</Label>
            <Select
              id="coupon-type"
              value={discountType}
              onChange={(event) =>
                setDiscountType(event.target.value as "PERCENT" | "FIXED")
              }
            >
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Amount off</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-value">
              {discountType === "PERCENT" ? "Percent (%)" : "Amount (₹)"}
            </Label>
            <Input
              id="coupon-value"
              type="number"
              min={1}
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-max">Max uses</Label>
            <Input
              id="coupon-max"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coupon-expiry">Expires</Label>
            <Input
              id="coupon-expiry"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>

          {fieldError ? (
            <div className="sm:col-span-2 lg:col-span-5">
              <FieldError message={fieldError} />
            </div>
          ) : null}

          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={creating}>
              {creating ? <Spinner /> : <Plus />}
              Create coupon
            </Button>
          </div>
        </form>

        {isPending ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : isError ? (
          <Alert variant="destructive" title="Could not load coupons">
            {error instanceof Error ? error.message : "Please try again."}
          </Alert>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No coupons yet. Create one to offer a discount at checkout.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {coupons.map((coupon) => {
              const exhausted =
                coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
              return (
                <li
                  key={coupon.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-medium">{coupon.code}</span>
                      <Badge
                        variant={coupon.isActive && !exhausted ? "success" : "secondary"}
                      >
                        {exhausted ? "Used up" : coupon.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {describe(coupon)} · {coupon.usedCount}
                      {coupon.maxUses ? `/${coupon.maxUses}` : ""} used
                      {coupon.expiresAt
                        ? ` · expires ${formatDate(coupon.expiresAt)}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === coupon.id}
                      onClick={() => toggle(coupon)}
                    >
                      {coupon.isActive ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete coupon ${coupon.code}`}
                      disabled={busyId === coupon.id}
                      onClick={() => setPendingDelete(coupon)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this coupon?"
        description="Attendees will no longer be able to apply this code. This cannot be undone."
        confirmLabel="Delete coupon"
        cancelLabel="Keep it"
        destructive
        busy={Boolean(busyId)}
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  );
}
