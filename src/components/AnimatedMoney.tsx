"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { formatAud } from "@/lib/format";

export function AnimatedMoney({ cents }: { cents: number }) {
  const raw = useMotionValue(cents);
  const spring = useSpring(raw, { stiffness: 200, damping: 30 });
  const text = useTransform(spring, (value) => formatAud(Math.round(value)));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    raw.set(cents);
  }, [cents, raw]);

  if (reducedMotion) {
    return <span data-testid="cart-total">{formatAud(cents)}</span>;
  }
  return <motion.span data-testid="cart-total">{text}</motion.span>;
}
