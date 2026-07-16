import Form from "next/form";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { requireRole } from "@/lib/guards";
import { pageCount, parsePage } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 48;

export const metadata: Metadata = { title: "Browse products" };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  await requireRole("CLEANER");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const category = (params.category ?? "").trim().slice(0, 120);
  const requestedPage = parsePage(params.page);
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { variantName: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
  };

  const [total, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { active: true, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);
  const totalPages = pageCount(total, PAGE_SIZE);
  const page = Math.min(requestedPage, totalPages);
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }, { id: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      variantName: true,
      category: true,
      imageUrl: true,
      priceCents: true,
    },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Product catalogue</h1>
      <Form
        action="/supplies/catalogue"
        className="mb-3 flex flex-col gap-2 sm:flex-row"
      >
        <label className="w-full">
          <span className="sr-only">Search products</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, variant or SKU…"
            maxLength={200}
            className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm shadow-sm"
          />
        </label>
        {category && <input type="hidden" name="category" value={category} />}
        <button className="min-h-10 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm">
          Search
        </button>
      </Form>
      <CategoryFilter
        categories={categories.map((item) => item.category!)}
        active={category}
        q={q}
      />
      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          hint="Try a different search or category."
        />
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            pathname="/supplies/catalogue"
            query={{ q, category }}
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
