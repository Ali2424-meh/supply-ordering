"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { input } from "@/lib/ui";

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
          className={input("lg")}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input("lg")}
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
