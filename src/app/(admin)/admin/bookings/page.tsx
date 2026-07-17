import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";
import { requireRole } from "@/lib/guards";

export default async function BookingsPage() {
  await requireRole("ADMIN");
  return (
    <ComingSoon
      icon={BookOpen}
      title="Bookings"
      description="Operations booking management."
      rows={[
        "Upcoming and past bookings",
        "Assignment to field workers",
        "Booking status and notes",
      ]}
    />
  );
}
