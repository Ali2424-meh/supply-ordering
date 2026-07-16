"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { removeFromCart, setCartQuantity } from "@/actions/cart";
import { submitOrder } from "@/actions/orders";
import { AnimatedMoney } from "@/components/AnimatedMoney";
import { cartTotalCents } from "@/lib/cart";
import { formatAud } from "@/lib/format";

type Line = {
  productId: string;
  name: string;
  variantName: string | null;
  imageUrl: string | null;
  priceCents: number;
  quantity: number;
  active: boolean;
};

export function CartView({ lines }: { lines: Line[] }) {
  const [pending, startTransition] = useTransition();
  const [invalid, setInvalid] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const total = cartTotalCents(lines);

  const act = (action: () => Promise<unknown>) =>
    startTransition(async () => {
      await action();
      router.refresh();
    });

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitOrder();
        if (result.ok) {
          router.push(
            `/supplies/cart/submitted?orderNumber=${encodeURIComponent(result.orderNumber)}`,
          );
        } else {
          setError(result.error);
          setInvalid(result.invalidProductIds ?? []);
          router.refresh();
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Submission failed.");
      }
    });
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Cart</h1>
      <ul>
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.li
              key={line.productId}
              data-testid="cart-line"
              layout
              exit={{ opacity: 0, x: -40 }}
              animate={
                invalid.includes(line.productId)
                  ? {
                      x: [0, -6, 6, -4, 4, 0],
                      transition: { duration: 0.4 },
                    }
                  : {}
              }
              className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto_auto_auto] ${invalid.includes(line.productId) ? "rounded bg-red-50 px-2" : ""}`}
            >
              {/* External/manual image hosts stay browser-fetched. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={line.imageUrl ?? "/placeholder.svg"}
                alt=""
                className="h-12 w-12 rounded bg-zinc-100 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {line.name}
                  {line.variantName ? ` — ${line.variantName}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatAud(line.priceCents)} each
                </p>
                {invalid.includes(line.productId) && (
                  <p className="text-xs font-medium text-red-600">
                    No longer available — please remove
                  </p>
                )}
              </div>
              <button
                disabled={pending}
                onClick={() => act(() => removeFromCart(line.productId))}
                className="min-h-11 min-w-11 text-sm text-red-500 sm:order-5"
                aria-label={`Remove ${line.name}`}
              >
                ✕
              </button>
              <div className="col-span-2 flex w-fit items-center rounded border sm:col-span-1 sm:order-3">
                <button
                  disabled={pending}
                  onClick={() =>
                    act(() =>
                      setCartQuantity(line.productId, line.quantity - 1),
                    )
                  }
                  className="min-h-10 min-w-10 px-2"
                  aria-label="Decrease"
                >
                  −
                </button>
                <span className="min-w-7 text-center text-sm">{line.quantity}</span>
                <button
                  disabled={pending}
                  onClick={() =>
                    act(() =>
                      setCartQuantity(line.productId, line.quantity + 1),
                    )
                  }
                  className="min-h-10 min-w-10 px-2"
                  aria-label="Increase"
                >
                  +
                </button>
              </div>
              <p className="text-right text-sm font-semibold sm:order-4 sm:w-20">
                {formatAud(line.priceCents * line.quantity)}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">Estimated total</p>
        <p className="text-lg font-bold">
          <AnimatedMoney cents={total} />
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <motion.button
        data-testid="submit-order"
        whileTap={{ scale: 0.97 }}
        disabled={pending}
        onClick={submit}
        className="mt-4 min-h-12 w-full rounded bg-emerald-600 py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit request"}
      </motion.button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        No payment is taken in the app. The operations team will contact you to
        confirm and arrange payment.
      </p>
    </div>
  );
}
