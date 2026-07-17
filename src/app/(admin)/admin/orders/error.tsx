"use client";

import { btn } from "@/lib/ui";

export default function OrdersError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-danger-tint p-6 text-center">
      <p className="mb-3 font-medium text-danger">
        Something went wrong loading orders.
      </p>
      <button onClick={reset} className={btn("danger", "md")}>
        Try again
      </button>
    </div>
  );
}
