"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { addToCart } from "@/actions/cart";

export function QuickAdd({
  productId,
  imageUrl,
}: {
  productId: string;
  imageUrl: string | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [flight, setFlight] = useState<{ fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const badge = document.getElementById("cart-badge");
    if (badge && !reducedMotion) {
      const from = event.currentTarget.getBoundingClientRect();
      const to = badge.getBoundingClientRect();
      setFlight({
        fromX: from.left + from.width / 2,
        fromY: from.top,
        toX: to.left + to.width / 2,
        toY: to.top + to.height / 2,
      });
    }
    startTransition(async () => {
      try {
        await addToCart(productId, quantity);
        router.refresh();
        setQuantity(1);
      } catch {
        setFlight(null);
      }
    });
  }

  function handleDecrease(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setQuantity((v) => Math.max(1, v - 1));
  }

  function handleIncrease(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setQuantity((v) => Math.min(999, v + 1));
  }

  return (
    <>
      <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
        {/* Stepper */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-white">
          <button
            disabled={pending}
            onClick={handleDecrease}
            className="flex h-8 w-7 items-center justify-center rounded-l-lg text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={11} />
          </button>
          <span className="min-w-6 text-center text-xs font-medium">{quantity}</span>
          <button
            disabled={pending}
            onClick={handleIncrease}
            className="flex h-8 w-7 items-center justify-center rounded-r-lg text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={11} />
          </button>
        </div>
        {/* Add button */}
        <button
          data-testid="add-to-cart"
          disabled={pending}
          onClick={handleAdd}
          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-brand px-2 text-xs font-medium text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60"
        >
          <ShoppingCart size={12} aria-hidden="true" />
          {pending ? "…" : "Add"}
        </button>
      </div>

      {/* Flight animation */}
      <AnimatePresence>
        {flight && (
          <motion.img
            src={imageUrl ?? "/placeholder.svg"}
            alt=""
            className="pointer-events-none fixed z-50 h-10 w-10 rounded-full object-cover"
            style={{ left: 0, top: 0 }}
            initial={{
              x: flight.fromX - 20,
              y: flight.fromY - 20,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: flight.toX - 20,
              y: flight.toY - 20,
              scale: 0.3,
              opacity: 0.6,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
            onAnimationComplete={() => setFlight(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
