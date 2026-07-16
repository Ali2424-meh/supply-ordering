"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { addToCart } from "@/actions/cart";

type Flight = { fromX: number; fromY: number; toX: number; toY: number };

export function AddToCartButton({
  productId,
  imageUrl,
}: {
  productId: string;
  imageUrl: string | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [pending, startTransition] = useTransition();
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  function launch(event: React.MouseEvent<HTMLButtonElement>) {
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
      await addToCart(productId, quantity);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-fit items-center rounded border">
        <button
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          className="min-h-11 px-4 py-1.5"
          aria-label="Decrease"
        >
          −
        </button>
        <span className="min-w-8 text-center text-sm" data-testid="qty">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((value) => Math.min(999, value + 1))}
          className="min-h-11 px-4 py-1.5"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      <motion.button
        data-testid="add-to-cart"
        whileTap={{ scale: 0.95 }}
        disabled={pending}
        onClick={launch}
        className="min-h-11 flex-1 rounded bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add to cart"}
      </motion.button>

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
    </div>
  );
}
