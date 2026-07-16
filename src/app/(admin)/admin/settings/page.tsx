import type { Metadata } from "next";
import { toggleSupplyAction } from "@/actions/settings";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const enabled = await supplyEnabled();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>
      <form action={toggleSupplyAction}>
        <p className="mb-2 text-sm">
          Supply ordering is <strong>{enabled ? "enabled" : "disabled"}</strong>.
        </p>
        <PendingSubmitButton
          pendingLabel="Saving…"
          className="min-h-10 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm disabled:opacity-60"
        >
          {enabled ? "Disable" : "Enable"} supply ordering
        </PendingSubmitButton>
      </form>
    </div>
  );
}
