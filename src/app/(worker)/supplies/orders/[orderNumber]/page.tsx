import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { OrderItemsView } from "@/components/OrderItemsView";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ReorderButton } from "@/components/ReorderButton";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { panel } from "@/lib/ui";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireRole("CLEANER");
  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const placed = order.createdAt.toLocaleDateString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "long",
  });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-start-1 lg:row-start-1">
        <PageHeader
          eyebrow="Order request"
          title={order.orderNumber}
          description={`Placed ${placed}`}
        />
        <OrderItemsView items={order.items} totalCents={order.totalCents} />

      </div>

      {/* Summary rail */}
      <section
        aria-labelledby="order-summary-heading"
        className={`${panel()} overflow-hidden lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
          <h2 id="order-summary-heading" className="text-base font-semibold">
            Summary
          </h2>
          <StatusBadge status={order.status} />
        </div>
        <dl className="divide-y divide-zinc-100 px-5 text-sm">
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500">Placed</dt>
            <dd className="font-medium text-zinc-800">{placed}</dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500">Items</dt>
            <dd className="font-medium text-zinc-800">{itemCount}</dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-zinc-500">Total</dt>
            <dd className="text-base font-bold text-zinc-900">
              {formatAud(order.totalCents)}
            </dd>
          </div>
        </dl>
        <div className="border-t border-zinc-100 px-5 py-4">
          <ReorderButton
            orderId={order.id}
            className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-brand/40 hover:text-brand"
          />
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Prices are locked to the time of submission. The operations team
            will contact you about any changes.
          </p>
        </div>
      </section>

      <div className="lg:col-start-1 lg:row-start-2">
        <h2 className="mb-3 text-base font-semibold">History</h2>
        <StatusTimeline events={order.events} showNotes={false} />
      </div>
    </div>
  );
}
