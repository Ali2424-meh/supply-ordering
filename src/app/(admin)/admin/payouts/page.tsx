import { requireRole } from "@/lib/guards";

export default async function PayoutsPage() {
  await requireRole("ADMIN");
  return <p className="text-zinc-500">Payouts — coming soon.</p>;
}
