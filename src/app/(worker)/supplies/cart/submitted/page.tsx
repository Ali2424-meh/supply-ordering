import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmittedCheck } from "@/components/SubmittedCheck";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const user = await requireRole("CLEANER");
  const { orderNumber } = await searchParams;
  if (!orderNumber) redirect("/supplies");
  const ownedOrder = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    select: { id: true },
  });
  if (!ownedOrder) notFound();
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
