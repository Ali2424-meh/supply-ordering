import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/statuses";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { q = "", status = "", sort = "newest" } = await searchParams;

  const orders = await prisma.order.findMany({
    where: {
      ...(status && STATUS_ORDER.includes(status as OrderStatus)
        ? { status: status as OrderStatus }
        : {}),
      ...(q
        ? {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" as const } },
              {
                user: {
                  name: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    },
    include: { user: { select: { name: true } } },
    orderBy:
      sort === "total"
        ? { totalCents: "desc" }
        : sort === "oldest"
          ? { createdAt: "asc" }
          : { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Order requests</h1>
      <Form
        action="/admin/orders"
        className="mb-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order # or worker…"
          className="min-h-10 rounded border p-2"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-10 rounded border p-2"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="min-h-10 rounded border p-2"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total">Highest total</option>
        </select>
        <button className="min-h-10 rounded bg-zinc-900 px-3 text-white">
          Apply
        </button>
      </Form>
      {orders.length === 0 ? (
        <EmptyState title="No matching orders" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Order</th>
                <th className="px-3">Worker</th>
                <th className="px-3">Status</th>
                <th className="px-3">Date</th>
                <th className="py-2 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  data-testid="admin-order-row"
                  className="border-t hover:bg-zinc-50"
                >
                  <td className="py-3 pr-3">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-medium text-blue-700 underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3">{order.user.name}</td>
                  <td className="px-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-3">
                    {order.createdAt.toLocaleDateString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    {formatAud(order.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
