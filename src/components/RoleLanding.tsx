"use client";

import { motion } from "motion/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-tint via-white to-zinc-100 p-4">
      <motion.section
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60"
      >
        <div className="border-b border-zinc-100 px-6 py-5">
          <Brand variant="sidebar" />
        </div>
        <div className="p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand">
            <ShieldCheck size={21} aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {roleLabel}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
            Signed in as {email}
          </p>
          <form action={signOutAction} className="mt-5">
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </motion.section>
    </main>
  );
}
