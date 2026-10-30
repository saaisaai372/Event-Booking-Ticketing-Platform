import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  EXPIRED: "secondary",
  APPROVED: "success",
  REJECTED: "destructive",
  DRAFT: "secondary",
  VALID: "success",
  USED: "secondary",
  HELD: "warning",
  SUCCESS: "success",
  FAILED: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}
