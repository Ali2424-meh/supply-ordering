import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchBar } from "@/components/SearchBar";
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
      <PageHeader
        eyebrow="Supplies"
        title="Product catalogue"
        description={`${total.toLocaleString("en-AU")} item${total === 1 ? "" : "s"}${category ? ` in ${category}` : ""}${q ? ` matching “${q}”` : ""}`}
      />
      <div className="mb-3">
        <Suspense fallback={
          <div className="min-h-10 w-full rounded-lg border border-zinc-200 bg-white shadow-sm" />
        }>
          <SearchBar defaultValue={q} category={category} />
        </Suspense>
      </div>
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
