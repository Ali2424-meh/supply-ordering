"use client";

import { motion, useScroll, useSpring } from "motion/react";

export function WorkerScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.35,
  });

  return (
    <motion.div
      data-testid="worker-scroll-progress"
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-sky-400 via-brand to-indigo-400 shadow-[0_0_14px_rgba(59,130,246,0.45)] motion-reduce:hidden"
      style={{ scaleX }}
    />
  );
}
