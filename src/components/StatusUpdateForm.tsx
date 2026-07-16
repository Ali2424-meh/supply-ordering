"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/actions/orders";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/statuses";

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
    <div className="h-fit rounded-lg border p-4">
      <h2 className="mb-2 text-sm font-semibold">Update status</h2>
      <select
        data-testid="status-select"
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus)}
        className="mb-2 min-h-10 w-full rounded border p-2 text-sm"
      >
        {STATUS_ORDER.map((item) => (
          <option key={item} value={item}>
            {STATUS_LABELS[item]}
          </option>
        ))}
      </select>
      <textarea
        data-testid="status-note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Internal note (optional)"
        rows={2}
        maxLength={2_000}
        className="mb-2 w-full rounded border p-2 text-sm"
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
        className="min-h-10 w-full rounded bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </motion.button>
    </div>
  );
}
