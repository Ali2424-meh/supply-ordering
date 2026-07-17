import type { Metadata } from "next";
import { AccountForm } from "@/components/AccountForm";
import { requireRole } from "@/lib/guards";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireRole("SUPPLY_MANAGER", "ADMIN");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          Account settings
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Your details
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Keep your contact information current for supply-order coordination.
        </p>
      </div>
      <AccountForm
        name={user.name}
        email={user.email}
        phone={user.phone}
        roleLabel={
          user.role === "ADMIN" ? "Administrator" : "Supply manager"
        }
      />
    </div>
  );
}
