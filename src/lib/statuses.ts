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

export const STATUS_COLORS: Record<OrderStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-sky-100 text-sky-800",
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  ORDERED_FROM_SUPPLIER: "bg-violet-100 text-violet-800",
  READY_FOR_COLLECTION: "bg-teal-100 text-teal-800",
  DELIVERED_COLLECTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  ISSUE_ON_HOLD: "bg-red-100 text-red-800",
};
