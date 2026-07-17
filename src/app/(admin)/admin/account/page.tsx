import type { Metadata } from "next";
import { AccountForm } from "@/components/AccountForm";
import { PageHeader } from "@/components/PageHeader";
import { requireRole } from "@/lib/guards";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireRole("SUPPLY_MANAGER", "ADMIN");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Account settings"
        title="Your details"
        description="Keep your contact information current for supply-order coordination."
      />
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
