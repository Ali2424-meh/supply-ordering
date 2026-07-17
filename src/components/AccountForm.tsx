"use client";

import { useActionState } from "react";
import { CheckCircle2, UserRound } from "lucide-react";
import { updateAccount } from "@/actions/account";

export function AccountForm({
  name,
  email,
  phone,
  roleLabel,
}: {
  name: string;
  email: string;
  phone: string | null;
  roleLabel: string;
}) {
  const [state, action, pending] = useActionState(updateAccount, {});

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-4 sm:px-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand">
          <UserRound size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-zinc-900">{name}</p>
          <p className="text-sm text-zinc-500">{roleLabel}</p>
        </div>
      </div>

      <form action={action} className="grid gap-4 p-5 sm:p-6">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
          Name
          <input
            name="name"
            defaultValue={name}
            required
            maxLength={100}
            autoComplete="name"
            className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 font-normal shadow-sm"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
          Email
          <input
            value={email}
            readOnly
            aria-describedby="email-hint"
            className="min-h-11 rounded-lg border border-zinc-200 bg-zinc-50 px-3 font-normal text-zinc-500"
          />
          <span id="email-hint" className="text-xs font-normal text-zinc-400">
            Your email is managed by an administrator.
          </span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
          Phone
          <input
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            maxLength={40}
            autoComplete="tel"
            placeholder="Optional"
            className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 font-normal shadow-sm"
          />
        </label>

        <div className="min-h-5">
          <p role="alert" aria-atomic="true" className="text-sm text-red-600">
            {state.error ?? ""}
          </p>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex items-center gap-1.5 text-sm text-emerald-700"
          >
            {!pending && state.ok ? (
              <>
                <CheckCircle2 size={16} aria-hidden="true" />
                Account details saved.
              </>
            ) : null}
          </p>
        </div>

        <button
          disabled={pending}
          className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-60 sm:w-fit"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
