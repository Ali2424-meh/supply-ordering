"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

export function CartBadge({ count }: { count: number }) {
  return (
    <Link
      href="/supplies/cart"
      id="cart-badge"
      className="relative rounded p-2"
      aria-label={`Cart, ${count} items`}
    >
      <span aria-hidden="true">🛒</span>
      <AnimatePresence mode="popLayout">
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
