"use client";

import { motion } from "motion/react";
import { LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { btn } from "@/lib/ui";

export function RoleLanding({
  name,
  email,
  roleLabel,
  description,
}: {
  name: string;
  email: string;
  roleLabel: string;
  description: string;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_80%_10%,var(--color-brand-soft),transparent_30%),linear-gradient(135deg,#f8fafc,#f4f4f5)] p-4">
      <motion.section
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="grid w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl shadow-blue-950/10 sm:grid-cols-[0.9fr_1.1fr]"
      >
        {/* Brand panel */}
        <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-brand p-7 text-white sm:flex">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(147,197,253,0.25),transparent_38%),radial-gradient(circle_at_90%_85%,rgba(255,255,255,0.12),transparent_38%)]"
          />
          <Brand variant="sidebar" onDark />
          <div>
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-100 backdrop-blur-sm">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <p className="text-lg font-semibold leading-snug tracking-[-0.02em]">
              One workspace for the whole team.
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-50/75">
              <Sparkles size={12} aria-hidden="true" />
              SupplyHub
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8">
          <div className="mb-5 sm:hidden">
            <Brand variant="sidebar" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {roleLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          <dl className="mt-5 divide-y divide-zinc-100 rounded-xl border border-zinc-200 text-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <dt className="text-zinc-500">Signed in as</dt>
              <dd className="min-w-0 break-words text-right font-medium text-zinc-800">
                {email}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <dt className="text-zinc-500">Access level</dt>
              <dd className="font-medium text-zinc-800">{roleLabel}</dd>
            </div>
          </dl>
          <form action={signOutAction} className="mt-5">
            <button className={`${btn("secondary", "md")} w-full`}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </motion.section>
    </main>
  );
}
