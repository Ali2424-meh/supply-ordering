"use client";

import {
  CheckCircle2,
  PackageCheck,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Brand } from "@/components/Brand";

const steps = [
  {
    icon: Search,
    title: "Find it fast",
    detail: "Browse the live supply catalogue",
  },
  {
    icon: ShoppingCart,
    title: "Build a request",
    detail: "Choose quantities in a few taps",
  },
  {
    icon: PackageCheck,
    title: "Follow progress",
    detail: "Track every request from one place",
  },
];

export function LoginShowcase() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      data-testid="login-showcase"
      className="relative isolate min-h-[13rem] overflow-hidden bg-brand px-5 py-5 text-white sm:min-h-[20rem] sm:px-9 sm:py-8 lg:min-h-full lg:px-12 lg:py-11"
      aria-labelledby="showcase-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(147,197,253,0.25),transparent_34%),radial-gradient(circle_at_90%_75%,rgba(255,255,255,0.13),transparent_38%)]"
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10 bg-white/[0.04]"
        animate={
          reducedMotion
            ? undefined
            : { x: [0, -12, 0], y: [0, 10, 0], scale: [1, 1.05, 1] }
        }
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-sky-200/10 bg-sky-300/[0.08]"
        animate={
          reducedMotion
            ? undefined
            : { x: [0, 14, 0], y: [0, -9, 0], scale: [1, 1.04, 1] }
        }
        transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Brand variant="sidebar" onDark />
        </motion.div>

        <div className="my-auto py-5 sm:py-8 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="max-w-xl"
          >
            <p className="mb-3 hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-50 backdrop-blur-sm sm:inline-flex">
              <Sparkles size={13} aria-hidden="true" />
              Simple supply ordering
            </p>
            <h2
              id="showcase-heading"
              className="max-w-lg text-2xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-4xl lg:text-[3.15rem]"
            >
              From shelf to request, without the paperwork.
            </h2>
            <p className="mt-4 hidden max-w-md text-sm leading-6 text-blue-50/75 sm:block sm:text-base sm:leading-7">
              One focused workspace for the supplies your team needs and the
              orders that keep every site moving.
            </p>
          </motion.div>

          <ol className="mt-5 hidden max-w-2xl grid-cols-3 gap-2 sm:mt-7 sm:grid sm:gap-2.5 lg:mt-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.22 + index * 0.09 }}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.08] p-3 backdrop-blur-sm sm:p-4"
                >
                  <motion.span
                    data-testid="login-step-icon"
                    className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-200 text-brand shadow-lg shadow-black/10 sm:mb-3"
                    animate={
                      reducedMotion
                        ? undefined
                        : { y: [0, -4, 0], rotate: [0, index - 1, 0] }
                    }
                    transition={{
                      duration: 3.8 + index * 0.55,
                      ease: "easeInOut",
                      repeat: Infinity,
                      delay: index * 0.4,
                    }}
                  >
                    <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
                  </motion.span>
                  <p className="text-[11px] font-semibold leading-4 sm:text-sm">
                    {step.title}
                  </p>
                  <p className="mt-1 hidden text-xs leading-5 text-blue-50/75 sm:block">
                    {step.detail}
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="hidden items-center gap-2 text-xs text-blue-50/75 sm:flex"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Built for cleaners, customers and supply teams
        </motion.p>
      </div>
    </section>
  );
}
