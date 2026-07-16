import { requireRole } from "@/lib/guards";

export default async function BookingsPage() {
  await requireRole("ADMIN");
  return <p className="text-zinc-500">Bookings — coming soon.</p>;
}
