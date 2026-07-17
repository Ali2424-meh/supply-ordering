"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  PackageSearch,
  PhoneCall,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    icon: PackageSearch,
    title: "Choose what you need",
    description:
      "Browse live catalogue items and build one clear supply request.",
    accent: "bg-blue-100 text-blue-800",
  },
  {
    number: "02",
    icon: PhoneCall,
    title: "Your team confirms",
    description:
      "Operations reviews the request, contacts you and arranges payment.",
    accent: "bg-amber-100 text-amber-800",
  },
  {
    number: "03",
    icon: Truck,
    title: "Follow every update",
    description:
      "See progress from Submitted through collection or delivery.",
    accent: "bg-sky-100 text-sky-800",
  },
];

export function SupplyJourney() {
  return (
    <motion.section
      data-testid="supply-journey"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9"
      aria-labelledby="journey-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_90%_0%,rgba(147,197,253,0.32),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(37,99,235,0.08),transparent_30%)]"
      />
      <motion.div
        data-testid="journey-orbit"
        aria-hidden="true"
        className="absolute -right-16 -top-16 -z-10 h-48 w-48 rounded-full border border-brand/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute bottom-5 left-4 h-3 w-3 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.8)]" />
      </motion.div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
            <Route size={14} aria-hidden="true" />
            Your supply journey
          </p>
          <h2
            id="journey-heading"
            className="max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.025em] text-zinc-950 sm:text-3xl"
          >
            One request. A clear path from cart to site.
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/15 bg-brand-tint px-3 py-1.5 text-xs font-medium text-brand">
          <ShieldCheck size={14} aria-hidden="true" />
          No in-app payment
        </span>
      </div>

      <div className="relative mt-7 grid gap-3 lg:grid-cols-3 lg:gap-5">
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[16%] right-[16%] top-10 hidden h-px origin-left bg-gradient-to-r from-blue-300 via-amber-300 to-sky-300 lg:block"
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.48,
                delay: 0.12 + index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5 }}
              className="group relative rounded-2xl border border-zinc-200/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg hover:shadow-blue-950/5 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <motion.span
                  whileHover={{ rotate: -7, scale: 1.08 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${step.accent}`}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </motion.span>
                <span className="text-xs font-semibold tracking-[0.15em] text-zinc-300">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-5 font-semibold text-zinc-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                {step.description}
              </p>
              <CheckCircle2
                size={16}
                aria-hidden="true"
                className="absolute bottom-5 right-5 text-zinc-200 transition-colors group-hover:text-brand"
              />
            </motion.article>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-zinc-950 px-4 py-4 text-white sm:flex-row sm:items-center sm:px-5">
        <p className="flex items-center gap-2 text-sm text-zinc-300">
          <Sparkles size={15} className="shrink-0 text-sky-300" aria-hidden="true" />
          Ready to make your next supply run simpler?
        </p>
        <Link
          href="/supplies/catalogue"
          className="group inline-flex min-h-10 w-fit items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-blue-100"
        >
          Explore supplies
          <ArrowUpRight
            size={15}
            aria-hidden="true"
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </motion.section>
  );
}
