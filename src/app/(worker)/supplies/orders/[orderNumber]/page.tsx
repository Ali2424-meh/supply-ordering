import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ReorderButton } from "@/components/ReorderButton";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{order.orderNumber}</h1>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <ReorderButton orderId={order.id} />
        </div>
      </div>
      <div className="mb-6 overflow-x-auto">
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
      <h2 className="mb-2 text-sm font-semibold text-zinc-500">History</h2>
      <StatusTimeline events={order.events} showNotes={false} />
    </div>
  );
}
