import Form from "next/form";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatus, type Prisma } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { pageCount, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";
import { STATUS_LABELS, STATUS_ORDER, statusDotClass } from "@/lib/statuses";

const PAGE_SIZE = 50;

export const metadata: Metadata = { title: "Order requests" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const status = params.status ?? "";
  const sort = params.sort ?? "newest";
  const requestedPage = parsePage(params.page);
  const where: Prisma.OrderWhereInput = {
    ...(status && STATUS_ORDER.includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Status summary counts (always unfiltered by status, preserves q filter)
  const qWhere: Prisma.OrderWhereInput = q
    ? {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    where: qWhere,
    _count: { _all: true },
  });

  const countByStatus = Object.fromEntries(
    statusCounts.map((r) => [r.status, r._count._all]),
  ) as Partial<Record<OrderStatus, number>>;

  const totalAllStatuses = Object.values(countByStatus).reduce(
    (s, n) => s + (n ?? 0),
    0,
  );

  const total = await prisma.order.count({ where });
  const totalPages = pageCount(total, PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);
  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy:
      sort === "total"
        ? [{ totalCents: "desc" }, { id: "desc" }]
        : sort === "oldest"
          ? [{ createdAt: "asc" }, { id: "asc" }]
          : [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  /** Build URL preserving q + sort but setting/clearing status */
  function cardHref(s: string) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (sort && sort !== "newest") p.set("sort", sort);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Order requests</h1>

      {/* Status summary cards */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {/* All card */}
        <Link
          href={cardHref("")}
          className={`flex shrink-0 flex-col rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors ${
            status === ""
              ? "border-brand bg-brand text-white"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:shadow"
          }`}
        >
          <span className="text-xs font-medium opacity-80">All</span>
          <span className="mt-0.5 text-xl font-bold">{totalAllStatuses}</span>
        </Link>
        {STATUS_ORDER.map((s) => {
          const count = countByStatus[s] ?? 0;
          const isActive = status === s;
          const dotColor = statusDotClass(s);
          return (
            <Link
              key={s}
              href={cardHref(s)}
              className={`flex shrink-0 flex-col rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors ${
                isActive
                  ? "border-brand bg-brand-tint"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
                {STATUS_LABELS[s]}
              </span>
              <span className={`mt-0.5 text-xl font-bold ${isActive ? "text-brand" : "text-zinc-900"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <Form
        action="/admin/orders"
        className="mb-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]"
      >
        <label>
          <span className="sr-only">Search orders</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order #, worker or email…"
            maxLength={200}
            className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white p-2 shadow-sm"
          />
        </label>
        <label>
          <span className="sr-only">Order status</span>
          <select
            name="status"
            defaultValue={status}
            className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white p-2 shadow-sm"
          >
            <option value="">All statuses</option>
            {STATUS_ORDER.map((item) => (
              <option key={item} value={item}>
                {STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort orders</span>
          <select
            name="sort"
            defaultValue={sort}
            className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white p-2 shadow-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="total">Highest total</option>
          </select>
        </label>
        <button className="min-h-10 rounded-lg bg-zinc-900 px-3 font-medium text-white shadow-sm">
          Apply
        </button>
      </Form>
      {orders.length === 0 ? (
        <EmptyState title="No matching orders" />
      ) : (
        <>
          <ul className="grid gap-2 md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-zinc-600">{order.user.name}</p>
                    </div>
                    <p className="font-semibold">{formatAud(order.totalCents)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusBadge status={order.status} />
                    <p className="text-xs text-zinc-500">
                      {order.createdAt.toLocaleDateString("en-AU", {
                        timeZone: "Australia/Sydney",
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
            <table className="w-full min-w-3xl text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="py-3 pl-4 pr-3">Order</th>
                  <th scope="col" className="px-3">Worker</th>
                  <th scope="col" className="px-3">Status</th>
                  <th scope="col" className="px-3">Date</th>
                  <th scope="col" className="py-3 pl-3 pr-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    data-testid="admin-order-row"
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:text-brand-hover"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 text-zinc-700">{order.user.name}</td>
                    <td className="px-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 text-zinc-500">
                      {order.createdAt.toLocaleDateString("en-AU", {
                        timeZone: "Australia/Sydney",
                      })}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right font-medium">
                      {formatAud(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin/orders"
            query={{ q, status, sort }}
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
