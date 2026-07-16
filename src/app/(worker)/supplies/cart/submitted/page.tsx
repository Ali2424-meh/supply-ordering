import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmittedCheck } from "@/components/SubmittedCheck";
import { requireRole } from "@/lib/guards";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  await requireRole("CLEANER");
  const { orderNumber } = await searchParams;
  if (!orderNumber) redirect("/supplies");
  return (
    <div>
      <SubmittedCheck orderNumber={orderNumber} />
      <Link
        href="/supplies"
        className="block min-h-10 text-center text-sm text-blue-600 underline"
      >
        Back to my orders
      </Link>
    </div>
  );
}
