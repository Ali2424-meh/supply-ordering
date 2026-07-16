import Form from "next/form";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { ProductGrid } from "@/components/ProductGrid";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireRole("CLEANER");
  const { q = "", category = "" } = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.product.findMany({
      where: { active: true, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Product catalogue</h1>
      <Form
        action="/supplies/catalogue"
        className="mb-3 flex flex-col gap-2 sm:flex-row"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="min-h-10 w-full rounded border p-2 text-sm"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button className="min-h-10 rounded bg-zinc-900 px-4 text-sm text-white">
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
        <ProductGrid products={products} />
      )}
    </div>
  );
}
