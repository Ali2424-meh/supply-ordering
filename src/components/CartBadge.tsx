"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function CartBadge({ count }: { count: number }) {
  return (
    <Link
      href="/supplies/cart"
      id="cart-badge"
      className="relative rounded p-2 text-zinc-600 hover:text-brand"
      aria-label={`Cart, ${count} items`}
    >
      <ShoppingCart size={22} strokeWidth={1.75} aria-hidden="true" />
      <AnimatePresence mode="popLayout">
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
