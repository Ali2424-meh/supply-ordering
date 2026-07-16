import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Home } from "lucide-react";
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
    <div className="mx-auto max-w-md py-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <SubmittedCheck orderNumber={orderNumber} />
        <Link
          href="/supplies"
          className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover"
        >
          <Home size={15} aria-hidden="true" />
          Back to my orders
        </Link>
      </div>
    </div>
  );
}
