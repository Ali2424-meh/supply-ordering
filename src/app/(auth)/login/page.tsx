import type { Metadata } from "next";
import { LoginShowcase } from "@/components/LoginShowcase";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_80%_10%,var(--color-brand-soft),transparent_30%),linear-gradient(135deg,#f8fafc,#f4f4f5)] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-2xl shadow-blue-950/10 sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.15fr_0.85fr]">
        <LoginShowcase />
        <section
          className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12"
          aria-labelledby="login-heading"
        >
          <div className="w-full max-w-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Secure team access
            </p>
            <h1
              id="login-heading"
              className="text-3xl font-semibold tracking-tight text-zinc-950"
            >
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sign in to manage supplies and order requests.
            </p>
            <div className="mt-7">
              <LoginForm />
            </div>
            <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs leading-5 text-zinc-400">
              Access is provided by your SupplyHub administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
