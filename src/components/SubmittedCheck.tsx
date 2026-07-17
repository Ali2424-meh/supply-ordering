"use client";

import { motion } from "motion/react";

export function SubmittedCheck({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="flex flex-col items-center px-6 pb-6 pt-10 text-center">
      <motion.svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        className="mb-4"
        aria-hidden="true"
      >
        <motion.circle
          cx="36"
          cy="36"
          r="32"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M22 37 L32 47 L51 27"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        />
      </motion.svg>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xl font-semibold"
        data-testid="order-number"
      >
        Request {orderNumber} submitted
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-2 max-w-sm text-sm text-zinc-600"
      >
        The operations team will contact you to confirm your order and arrange
        payment.
      </motion.p>
    </div>
  );
}
