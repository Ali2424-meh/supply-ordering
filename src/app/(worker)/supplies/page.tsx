import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { pageCount, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export const metadata: Metadata = { title: "My supply orders" };

export default async function SuppliesHome({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("CLEANER");
  const requestedPage = parsePage((await searchParams).page);
  const total = await prisma.order.count({ where: { userId: user.id } });
  const totalPages = pageCount(total, PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">My supply orders</h1>
        <Link
          href="/supplies/catalogue"
        className="min-h-10 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
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
        <>
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li key={order.id} data-testid="order-card">
                <Link
                  href={`/supplies/orders/${order.orderNumber}`}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 hover:shadow sm:flex-row sm:items-center sm:justify-between"
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
          <Pagination
            pathname="/supplies"
            query={{}}
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
