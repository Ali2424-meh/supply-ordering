"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  PackageOpen,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const supplyCards = [
  {
    icon: ShoppingBag,
    label: "Daily essentials",
    className: "right-0 top-2 rotate-[3deg]",
    delay: 0,
  },
  {
    icon: PackageOpen,
    label: "Site supplies",
    className: "-left-6 top-[5.25rem] -rotate-[3deg]",
    delay: 0.55,
  },
  {
    icon: ClipboardCheck,
    label: "Request tracked",
    className: "right-3 top-[8.5rem] rotate-[2deg]",
    delay: 1.1,
  },
];

interface DashboardHeroProps {
  firstName: string;
  totalOrders: number;
  cartCount: number;
  productCount: number;
}

export function DashboardHero({
  firstName,
  totalOrders,
  cartCount,
  productCount,
}: DashboardHeroProps) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      data-testid="dashboard-hero"
      className="relative isolate overflow-hidden rounded-[1.75rem] bg-brand px-5 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-9 lg:min-h-[25rem] lg:px-10 lg:py-10"
      aria-labelledby="dashboard-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(167,243,208,0.22),transparent_33%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,0.06))]"
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-24 right-[18%] h-52 w-52 rounded-full border border-white/10"
        animate={
          reducedMotion
            ? undefined
            : { scale: [1, 1.08, 1], x: [0, 8, 0], y: [0, -5, 0] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-1/2 h-48 w-48 rounded-full bg-emerald-300/5 blur-2xl"
        animate={{ x: [0, 42, 0], scale: [1, 1.18, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute inset-y-0 -left-1/3 w-1/4 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/8 to-transparent"
        animate={{ x: ["0%", "650%"] }}
        transition={{ duration: 8, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
      />

      <div className="relative z-10 grid h-full items-center gap-7 md:grid-cols-[minmax(0,1fr)_17rem] lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42 }}
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
            <Sparkles size={13} aria-hidden="true" />
            Hello, {firstName}
          </p>
          <h1
            id="dashboard-heading"
            className="max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-[2.7rem] lg:text-5xl"
          >
            Everything you need, one request away.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base sm:leading-7">
            Find the right supplies, build your order and keep track of every
            request from one simple workspace.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/supplies/catalogue"
              className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
            >
              Browse catalogue
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-50/75">
              <span>
                <strong className="text-sm font-semibold text-white">
                  {totalOrders}
                </strong>{" "}
                order{totalOrders === 1 ? "" : "s"}
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-white/20" />
              <span>
                <strong className="text-sm font-semibold text-white">
                  {cartCount}
                </strong>{" "}
                in cart
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-white/20" />
              <span>
                <strong className="text-sm font-semibold text-white">
                  {productCount.toLocaleString("en-AU")}
                </strong>{" "}
                products
              </span>
            </div>
          </div>
        </motion.div>

        <div
          className="relative hidden h-64 md:block"
          aria-hidden="true"
        >
          <motion.div
            className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-emerald-200/25 lg:h-52 lg:w-52"
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 rounded-full bg-emerald-200 shadow-[0_0_18px_rgba(167,243,208,0.9)]" />
          </motion.div>
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-emerald-100 shadow-2xl shadow-emerald-950/20 backdrop-blur-md"
            animate={
              reducedMotion
                ? undefined
                : { scale: [1, 1.06, 1], rotate: [0, 2, 0, -2, 0] }
            }
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Package size={31} strokeWidth={1.7} />
          </motion.div>
          {supplyCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={
                  reducedMotion
                    ? { opacity: 1, y: 0, scale: 1 }
                    : {
                        opacity: 1,
                        y: [0, -6, 0],
                        scale: 1,
                      }
                }
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        opacity: { duration: 0.35, delay: 0.18 + index * 0.08 },
                        scale: { duration: 0.35, delay: 0.18 + index * 0.08 },
                        y: {
                          duration: 4.3 + index * 0.5,
                          delay: card.delay,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                }
                className={`absolute flex w-44 items-center gap-3 rounded-2xl border border-white/15 bg-white/12 p-3 shadow-xl shadow-emerald-950/15 backdrop-blur-md lg:w-48 ${card.className}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-brand">
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <span className="text-xs font-semibold">{card.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
