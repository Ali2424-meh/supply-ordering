"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/orders";
import { STATUS_LABELS, STATUS_ORDER, STATUS_COLORS } from "@/lib/statuses";

/** Map STATUS_COLORS "bg-X-100 text-X-800" → dot "bg-X-500" */
function dotColor(colorClass: string): string {
  const match = colorClass.match(/bg-(\w+-\d+)/);
  if (!match) return "bg-zinc-400";
  const base = match[1].replace(/-\d+$/, "");
  return `bg-${base}-500`;
}

export function StatusUpdateForm({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, note);
        setNote("");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Update failed.");
      }
    });
  }

  return (
    <div className="h-fit rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Update status</h2>

      {/* Color-chip radio group — data-testid="status-select" on the group */}
      <div
        data-testid="status-select"
        role="radiogroup"
        aria-label="Order status"
        className="mb-3 flex flex-wrap gap-2"
      >
        {STATUS_ORDER.map((s) => {
          const selected = status === s;
          const colorClass = STATUS_COLORS[s];
          const dot = dotColor(colorClass);
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setStatus(s)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                selected
                  ? `ring-2 ring-offset-1 ring-brand border-brand ${colorClass}`
                  : `border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50`
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>

      <textarea
        data-testid="status-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Internal note (optional)"
        rows={2}
        maxLength={2_000}
        className="mb-3 w-full rounded-lg border border-zinc-200 p-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <motion.button
        data-testid="save-status"
        whileTap={{ scale: 0.97 }}
        disabled={pending}
        onClick={save}
        className="min-h-10 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </motion.button>
    </div>
  );
}
