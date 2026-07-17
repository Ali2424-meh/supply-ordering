import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/statuses";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status].pill}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[status].dot}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
