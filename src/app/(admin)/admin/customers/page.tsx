import { requireRole } from "@/lib/guards";

export default async function CustomersPage() {
  await requireRole("ADMIN");
  return <p className="text-zinc-500">Customers — coming soon.</p>;
}
