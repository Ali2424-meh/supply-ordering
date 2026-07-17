import { notFound } from "next/navigation";
import { Mail, UserRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { OrderItemsView } from "@/components/OrderItemsView";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusUpdateForm } from "@/components/StatusUpdateForm";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";
import { panel } from "@/lib/ui";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const placed = order.createdAt.toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
  });

  return (
    <div>
      <PageHeader
        eyebrow="Order request"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderNumber}
            <StatusBadge status={order.status} />
          </span>
        }
        description={`Placed ${placed}`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 lg:order-1">
          <OrderItemsView items={order.items} totalCents={order.totalCents} />
          <h2 className="mb-3 mt-7 text-base font-semibold">History</h2>
          <StatusTimeline events={order.events} showNotes />
        </div>

        <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-7">
          <StatusUpdateForm orderId={order.id} current={order.status} />
          <section aria-labelledby="worker-heading" className={`${panel()} overflow-hidden`}>
            <h2
              id="worker-heading"
              className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold"
            >
              Worker
            </h2>
            <div className="flex items-start gap-3 px-4 py-3 text-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <UserRound size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-zinc-800">{order.user.name}</p>
                <p className="break-words text-zinc-500">{order.user.email}</p>
                {order.user.phone && (
                  <p className="text-zinc-500">{order.user.phone}</p>
                )}
              </div>
            </div>
            <div className="border-t border-zinc-100 px-4 py-3">
              <a
                href={`mailto:${order.user.email}`}
                className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
              >
                <Mail size={14} aria-hidden="true" />
                Email {order.user.name.split(" ")[0]}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
