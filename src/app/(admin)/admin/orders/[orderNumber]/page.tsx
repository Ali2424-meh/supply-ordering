import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusUpdateForm } from "@/components/StatusUpdateForm";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="mb-4 rounded-lg border p-4 text-sm">
          <p className="font-medium">{order.user.name}</p>
          <p className="break-words text-zinc-500">
            {order.user.email}
            {order.user.phone ? ` · ${order.user.phone}` : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm">
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 pr-3">
                    {item.nameSnapshot}
                    {item.variantSnapshot ? ` — ${item.variantSnapshot}` : ""}
                  </td>
                  <td className="px-3 text-center">× {item.quantity}</td>
                  <td className="py-2 pl-3 text-right">
                    {formatAud(item.priceCentsSnapshot * item.quantity)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td />
                <td className="text-right font-semibold">
                  {formatAud(order.totalCents)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2 className="mb-2 mt-6 text-sm font-semibold text-zinc-500">
          History
        </h2>
        <StatusTimeline events={order.events} showNotes />
      </div>
      <StatusUpdateForm orderId={order.id} current={order.status} />
    </div>
  );
}
