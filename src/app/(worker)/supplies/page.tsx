import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DashboardHero } from "@/components/DashboardHero";
import { Pagination } from "@/components/Pagination";
import { ReorderButton } from "@/components/ReorderButton";
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

  const [total, cartCount, categories] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.cartItem.count({ where: { userId: user.id } }),
    prisma.product.findMany({
      where: { active: true, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
      take: 6,
    }),
  ]);

  const totalPages = pageCount(total, PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="space-y-6">
      <DashboardHero
        firstName={firstName}
        totalOrders={total}
        cartCount={cartCount}
      />

      {/* Resume-cart card (shown only when cart has items) */}
      {cartCount > 0 && (
        <Link
          href="/supplies/cart"
          className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-tint p-4 shadow-sm transition hover:border-brand/40 hover:shadow"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <ShoppingCart size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-brand">You have {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart</p>
            <p className="text-sm text-zinc-600">Continue where you left off →</p>
          </div>
        </Link>
      )}

      {/* Category shortcut chips */}
      {categories.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Browse by category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Link
                key={item.category}
                href={`/supplies/catalogue?category=${encodeURIComponent(item.category!)}`}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:border-brand/40 hover:bg-brand-tint hover:text-brand"
              >
                <ShoppingBag size={13} aria-hidden="true" />
                {item.category}
              </Link>
            ))}
            <Link
              href="/supplies/catalogue"
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-500 shadow-sm transition hover:border-brand/40 hover:bg-brand-tint hover:text-brand"
            >
              View all →
            </Link>
          </div>
        </div>
      )}

      {/* Order list */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">My orders</h2>
          <Link
            href="/supplies/catalogue"
            className="min-h-9 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover"
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
                <li
                  key={order.id}
                  data-testid="order-card"
                  className="flex items-stretch gap-2 rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/30 hover:shadow"
                >
                  <Link
                    href={`/supplies/orders/${order.orderNumber}`}
                    className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
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
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatAud(order.totalCents)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center border-l border-zinc-100 px-3">
                    <ReorderButton
                      orderId={order.id}
                      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-brand-tint hover:text-brand"
                    />
                  </div>
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
    </div>
  );
}
