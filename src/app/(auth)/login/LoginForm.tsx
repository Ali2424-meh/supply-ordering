"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal shadow-sm transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-brand focus:ring-3 focus:ring-blue-100 focus:outline-none"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal shadow-sm transition hover:border-zinc-400 focus:border-brand focus:ring-3 focus:ring-blue-100 focus:outline-none"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="mt-2 min-h-12 rounded-xl bg-brand p-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
