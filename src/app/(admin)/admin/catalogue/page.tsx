import Form from "next/form";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { pageCount, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";
import { btn, input } from "@/lib/ui";

const PAGE_SIZE = 50;

export const metadata: Metadata = { title: "Manage products" };

export default async function AdminCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    state?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const state = params.state ?? "";
  const sort = params.sort ?? "name";
  const requestedPage = parsePage(params.page);
  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { variantName: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(state === "active"
      ? { active: true }
      : state === "inactive"
        ? { active: false }
        : {}),
  };

  const total = await prisma.product.count({ where });
  const totalPages = pageCount(total, PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);
  const products = await prisma.product.findMany({
    where,
    orderBy:
      sort === "price"
        ? [{ priceCents: "asc" }, { id: "asc" }]
        : sort === "category"
          ? [{ category: "asc" }, { name: "asc" }, { id: "asc" }]
          : [{ name: "asc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      variantName: true,
      category: true,
      source: true,
      active: true,
      priceCents: true,
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Supply"
        title="Product catalogue"
        description={`${total.toLocaleString("en-AU")} product${total === 1 ? "" : "s"}, active and inactive`}
        actions={
          <Link href="/admin/catalogue/new" className={btn("primary", "md")}>
            New product
          </Link>
        }
      />
      <Form
        action="/admin/catalogue"
        className="mb-4 grid gap-2 text-sm sm:hidden"
      >
        <label>
          <span className="sr-only">Search products</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, variant, SKU or category…"
            maxLength={200}
            className={input()}
          />
        </label>
        <details className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
          <summary className="flex min-h-10 cursor-pointer items-center justify-between px-1 text-sm font-medium text-zinc-700">
            State and sorting
            <span className="text-brand">Filters</span>
          </summary>
          <div className="mt-2 grid gap-2">
            <label>
              <span className="sr-only">Product state</span>
              <select
                name="state"
                defaultValue={state}
                className={input()}
              >
                <option value="">All states</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Sort products</span>
              <select
                name="sort"
                defaultValue={sort}
                className={input()}
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="price">Price</option>
              </select>
            </label>
          </div>
        </details>
        <button className={`${btn("primary", "md")} w-full`}>Apply</button>
      </Form>

      <Form
        action="/admin/catalogue"
        className="mb-4 hidden gap-2 text-sm sm:grid sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]"
      >
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search products</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, variant, SKU or category…"
            maxLength={200}
            className={input()}
          />
        </label>
        <label>
          <span className="sr-only">Product state</span>
          <select name="state" defaultValue={state} className={input()}>
            <option value="">All states</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort products</span>
          <select name="sort" defaultValue={sort} className={input()}>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="price">Price</option>
          </select>
        </label>
        <button className={`${btn("primary", "md")} w-full sm:col-span-2 lg:col-span-1 lg:w-auto`}>
          Apply
        </button>
      </Form>
      {products.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <>
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:hidden">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/catalogue/${product.id}/edit`}
                  className="block p-3 transition hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{product.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {[product.variantName, product.category]
                          .filter(Boolean)
                          .join(" · ") || "No variant or category"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatAud(product.priceCents)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 ${product.active ? "bg-brand-tint text-brand-deep" : "bg-zinc-200 text-zinc-600"}`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-zinc-500">
                      {product.source === "SYNCED" ? "Synced" : "Manual"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:block">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="w-1/2 py-3 pl-4 pr-3 xl:w-auto">Name</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Variant</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Category</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Source</th>
                  <th scope="col" className="px-3">State</th>
                  <th scope="col" className="py-3 pl-3 pr-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    data-testid="admin-product-row"
                    className="transition hover:bg-zinc-50"
                  >
                    <td className="py-3 pl-4 pr-3">
                      <Link
                        href={`/admin/catalogue/${product.id}/edit`}
                        className="font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:text-brand-hover"
                      >
                        {product.name}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-zinc-500 xl:hidden">
                        {[product.variantName, product.category, product.source === "SYNCED" ? "Synced" : "Manual"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td className="hidden px-3 text-zinc-600 xl:table-cell">{product.variantName ?? "—"}</td>
                    <td className="hidden px-3 text-zinc-600 xl:table-cell">{product.category ?? "—"}</td>
                    <td className="hidden px-3 text-zinc-600 xl:table-cell">
                      {product.source === "SYNCED" ? "Synced" : "Manual"}
                    </td>
                    <td className="px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.active ? "bg-brand-tint text-brand-deep" : "bg-zinc-200 text-zinc-600"}`}
                      >
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right font-medium">
                      {formatAud(product.priceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin/catalogue"
            query={{ q, state, sort }}
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
