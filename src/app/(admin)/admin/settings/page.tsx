import { toggleSupplyAction } from "@/actions/settings";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";

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
        <button className="min-h-10 rounded bg-zinc-900 px-3 py-1.5 text-sm text-white">
          {enabled ? "Disable" : "Enable"} supply ordering
        </button>
      </form>
    </div>
  );
}
