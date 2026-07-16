import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function SuppliesHome() {
  const user = await requireRole("CLEANER");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">My supply orders</h1>
        <Link
          href="/supplies/catalogue"
          className="min-h-10 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
        >
          New order
        </Link>
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          hint="Start a new order from the catalogue."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((order) => (
            <li key={order.id} data-testid="order-card">
              <Link
                href={`/supplies/orders/${order.orderNumber}`}
                className="flex flex-col gap-3 rounded-lg border p-3 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-zinc-500">
                    {order.createdAt.toLocaleDateString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge status={order.status} />
                  <p className="text-sm font-semibold">
                    {formatAud(order.totalCents)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
