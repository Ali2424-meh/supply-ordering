import { notFound } from "next/navigation";
import { Mail, UserRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusUpdateForm } from "@/components/StatusUpdateForm";
import { formatAud } from "@/lib/format";
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
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
        <div className={`${panel()} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="py-3 pl-4 pr-3">Item</th>
                <th scope="col" className="px-3 text-center">Qty</th>
                <th scope="col" className="py-3 pl-3 pr-4 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pl-4 pr-3">
                    <span className="font-medium text-zinc-800">
                      {item.nameSnapshot}
                    </span>
                    {item.variantSnapshot && (
                      <span className="text-zinc-500"> — {item.variantSnapshot}</span>
                    )}
                    <span className="block text-xs text-zinc-400">
                      {formatAud(item.priceCentsSnapshot)} each
                    </span>
                  </td>
                  <td className="px-3 text-center text-zinc-600">{item.quantity}</td>
                  <td className="py-2.5 pl-3 pr-4 text-right font-medium">
                    {formatAud(item.priceCentsSnapshot * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-zinc-200 bg-zinc-50/60">
              <tr>
                <td className="py-3 pl-4 font-semibold">Total</td>
                <td />
                <td className="py-3 pl-3 pr-4 text-right font-semibold">
                  {formatAud(order.totalCents)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <h2 className="mb-3 mt-7 text-base font-semibold">History</h2>
        <StatusTimeline events={order.events} showNotes />
      </div>

      <div className="space-y-4 lg:sticky lg:top-7">
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
  );
}
