import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Home } from "lucide-react";
import { SubmittedCheck } from "@/components/SubmittedCheck";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { statusDotClass } from "@/lib/statuses";
import { btn, panel } from "@/lib/ui";

const NEXT_STEPS = [
  {
    status: "CONTACTED" as const,
    title: "Operations makes contact",
    detail: "The team reviews your request and reaches out to confirm it.",
  },
  {
    status: "AWAITING_PAYMENT" as const,
    title: "Payment is arranged",
    detail: "Payment happens outside the app — staff will sort it with you.",
  },
  {
    status: "READY_FOR_COLLECTION" as const,
    title: "Collect or receive your supplies",
    detail: "Track every step from your orders list.",
  },
];

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
    <div className="mx-auto max-w-2xl py-4">
      <div className={`${panel()} overflow-hidden`}>
        <SubmittedCheck orderNumber={orderNumber} />
        <div className="border-t border-zinc-100 px-6 py-5">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            What happens next
          </h2>
          <ol className="divide-y divide-zinc-100">
            {NEXT_STEPS.map((step) => (
              <li key={step.status} className="flex items-start gap-3 py-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass(step.status)}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-800">
                    {step.title}
                  </p>
                  <p className="text-xs text-zinc-500">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/supplies" className={`${btn("primary", "md")} flex-1`}>
              <Home size={15} aria-hidden="true" />
              Back to my orders
            </Link>
            <Link
              href="/supplies/catalogue"
              className={`${btn("ghost", "md")} flex-1`}
            >
              Keep browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
