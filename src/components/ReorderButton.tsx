"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { reorderFromOrder } from "@/actions/orders";
import { useToast } from "@/components/Toaster";

interface ReorderButtonProps {
  orderId: string;
  className?: string;
}

export function ReorderButton({ orderId, className }: ReorderButtonProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleReorder(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const result = await reorderFromOrder(orderId);
      if (result.ok) {
        let message = `Added ${result.added} item${result.added !== 1 ? "s" : ""} to cart`;
        if (result.skipped > 0) {
          message += ` (${result.skipped} unavailable item${result.skipped !== 1 ? "s" : ""} skipped)`;
        }
        toast(message);
        router.push("/supplies/cart");
      } else {
        toast(result.error ?? "Could not reorder — no items available.");
      }
    } catch {
      toast("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      disabled={pending}
      className={
        className ??
        "flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-tint px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand hover:text-white disabled:opacity-50"
      }
      aria-label="Reorder"
    >
      <RotateCcw size={14} aria-hidden="true" className={pending ? "animate-spin" : ""} />
      {pending ? "Adding…" : "Reorder"}
    </button>
  );
}
