import { DollarSign } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { requireRole } from "@/lib/guards";

export default async function PayoutsPage() {
  await requireRole("ADMIN");
  return (
    <ComingSoon
      icon={DollarSign}
      title="Payouts"
      description="Worker payment runs and statements."
      rows={[
        "Payout runs and approvals",
        "Per-worker statements",
        "Export for accounting",
      ]}
    />
  );
}
