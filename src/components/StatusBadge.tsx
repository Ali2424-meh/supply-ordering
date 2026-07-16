import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/statuses";

/** Tailwind-safe dot color per status */
const DOT_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-blue-500",
  CONTACTED: "bg-sky-500",
  AWAITING_PAYMENT: "bg-amber-500",
  PAID: "bg-emerald-500",
  ORDERED_FROM_SUPPLIER: "bg-violet-500",
  READY_FOR_COLLECTION: "bg-teal-500",
  DELIVERED_COLLECTED: "bg-green-600",
  CANCELLED: "bg-zinc-400",
  ISSUE_ON_HOLD: "bg-red-500",
};

/** Background tint + text color for the pill */
const PILL_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-blue-50 text-blue-800",
  CONTACTED: "bg-sky-50 text-sky-800",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-800",
  PAID: "bg-emerald-50 text-emerald-800",
  ORDERED_FROM_SUPPLIER: "bg-violet-50 text-violet-800",
  READY_FOR_COLLECTION: "bg-teal-50 text-teal-800",
  DELIVERED_COLLECTED: "bg-green-50 text-green-800",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  ISSUE_ON_HOLD: "bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${PILL_COLORS[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[status]}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
