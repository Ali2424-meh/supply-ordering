import type { Metadata } from "next";
import Link from "next/link";
import { toggleSupplyAction } from "@/actions/settings";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";
import { btn, panel } from "@/lib/ui";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const enabled = await supplyEnabled();
  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Platform-wide switches for the supply ordering capability."
      />
      <div className={`${panel()} max-w-2xl divide-y divide-zinc-100 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900">
              Supply ordering
            </h2>
            <span className="block text-xs text-zinc-500">
              Controls the worker Supplies portal and the supply admin screens.
            </span>
          </div>
          {/* setFeature e2e helper reads the single <p> inside this form */}
          <form action={toggleSupplyAction} className="flex items-center gap-3">
            <p className="text-sm text-zinc-600">
              Supply ordering is{" "}
              <strong>{enabled ? "enabled" : "disabled"}</strong>.
            </p>
            <PendingSubmitButton
              pendingLabel="Saving…"
              className={btn("primary", "md")}
            >
              {enabled ? "Disable" : "Enable"} supply ordering
            </PendingSubmitButton>
          </form>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900">
              Catalogue sync
            </h2>
            <span className="block text-xs text-zinc-500">
              Product data is refreshed from cleanersgallery.com.au on demand.
            </span>
          </div>
          <Link href="/admin/imports" className={btn("secondary", "md")}>
            Open import history
          </Link>
        </div>
      </div>
    </div>
  );
}
