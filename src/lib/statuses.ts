import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: "Submitted",
  CONTACTED: "Contacted",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  ORDERED_FROM_SUPPLIER: "Ordered from supplier",
  READY_FOR_COLLECTION: "Ready for collection",
  DELIVERED_COLLECTED: "Delivered / collected",
  CANCELLED: "Cancelled",
  ISSUE_ON_HOLD: "Issue / on hold",
};

export const STATUS_ORDER = Object.keys(STATUS_LABELS) as OrderStatus[];

/**
 * Full literal class lists per status — Tailwind's scanner cannot see
 * interpolated class names, so every dot/pill string must appear verbatim.
 * Palette rule: cool blue-family hues while an order is in motion, amber for
 * waiting-on-payment, deep brand blue for terminal success, zinc/red for
 * cancelled/problem. No greens — success is brand-blue app-wide.
 */
export const STATUS_STYLES: Record<OrderStatus, { dot: string; pill: string }> =
  {
    SUBMITTED: { dot: "bg-blue-500", pill: "bg-blue-50 text-blue-800" },
    CONTACTED: { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-800" },
    AWAITING_PAYMENT: {
      dot: "bg-amber-500",
      pill: "bg-amber-50 text-amber-800",
    },
    PAID: { dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-800" },
    ORDERED_FROM_SUPPLIER: {
      dot: "bg-violet-500",
      pill: "bg-violet-50 text-violet-800",
    },
    READY_FOR_COLLECTION: {
      dot: "bg-cyan-500",
      pill: "bg-cyan-50 text-cyan-800",
    },
    DELIVERED_COLLECTED: {
      dot: "bg-blue-700",
      pill: "bg-blue-100 text-blue-900",
    },
    CANCELLED: { dot: "bg-zinc-400", pill: "bg-zinc-100 text-zinc-600" },
    ISSUE_ON_HOLD: { dot: "bg-red-500", pill: "bg-red-50 text-red-800" },
  };

export function statusDotClass(status: OrderStatus): string {
  return STATUS_STYLES[status].dot;
}

export function statusPillClass(status: OrderStatus): string {
  return STATUS_STYLES[status].pill;
}
