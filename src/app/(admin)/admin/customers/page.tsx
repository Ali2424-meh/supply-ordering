import { Users } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { requireRole } from "@/lib/guards";

export default async function CustomersPage() {
  await requireRole("ADMIN");
  return (
    <ComingSoon
      icon={Users}
      title="Customers"
      description="End-customer records and contact details."
      rows={[
        "Customer directory and search",
        "Contact and address details",
        "Service history",
      ]}
    />
  );
}
