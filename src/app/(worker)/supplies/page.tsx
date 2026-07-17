import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, LifeBuoy, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DashboardHero } from "@/components/DashboardHero";
import { Pagination } from "@/components/Pagination";
import { ReorderButton } from "@/components/ReorderButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatusBadge } from "@/components/StatusBadge";
import { SupplyJourney } from "@/components/SupplyJourney";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { pageCount, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { btn, panel } from "@/lib/ui";

const PAGE_SIZE = 20;

export const metadata: Metadata = { title: "My supply orders" };

export default async function SuppliesHome({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole("CLEANER");
  const requestedPage = parsePage((await searchParams).page);

  const [total, cartCount, categoryCounts, productCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.cartItem.count({ where: { userId: user.id } }),
    prisma.product.groupBy({
      by: ["category"],
      where: { active: true, category: { not: null } },
      _count: { _all: true },
      orderBy: [{ _count: { category: "desc" } }, { category: "asc" }],
      take: 5,
    }),
    prisma.product.count({ where: { active: true } }),
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
        productCount={productCount}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column: orders */}
        <ScrollReveal>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">My orders</h2>
            <Link href="/supplies/catalogue" className={btn("primary", "sm")}>
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
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    data-testid="order-card"
                    className="flex items-stretch gap-2 transition hover:bg-brand-tint/40"
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
        </ScrollReveal>

        {/* Right rail */}
        <ScrollReveal
          delay={0.05}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-24 lg:block lg:space-y-4">
            {cartCount > 0 && (
              <Link
                href="/supplies/cart"
                className="group flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-tint p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:col-span-2 lg:col-span-1"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-transform group-hover:rotate-[-7deg] group-hover:scale-105">
                  <ShoppingCart size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-brand">
                    {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart
                  </p>
                  <p className="text-sm text-zinc-600">
                    Continue where you left off →
                  </p>
                </div>
              </Link>
            )}

            {categoryCounts.length > 0 && (
              <nav aria-label="Browse by category" className={panel()}>
                <p className="border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Popular categories
                </p>
                <ul className="divide-y divide-zinc-100">
                  {categoryCounts.map((row) => (
                    <li key={row.category}>
                      <Link
                        href={`/supplies/catalogue?category=${encodeURIComponent(row.category!)}`}
                        className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 text-sm text-zinc-700 transition hover:bg-brand-tint/50 hover:text-brand"
                      >
                        <span className="min-w-0 truncate">{row.category}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                          {row._count._all}
                          <ChevronRight size={13} aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/supplies/catalogue"
                      className="flex min-h-11 items-center px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-tint/50"
                    >
                      View the full catalogue →
                    </Link>
                  </li>
                </ul>
              </nav>
            )}

            <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                <LifeBuoy size={17} aria-hidden="true" />
              </span>
              <p className="text-zinc-600">
                Questions about an order? The operations team confirms every
                request and arranges payment with you directly.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="lg:col-start-1 lg:row-start-2">
          <SupplyJourney />
        </ScrollReveal>
      </div>
    </div>
  );
}
