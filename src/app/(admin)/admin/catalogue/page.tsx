import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export default async function AdminCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; sort?: string }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { q = "", state = "", sort = "name" } = await searchParams;

  const products = await prisma.product.findMany({
    where: {
      ...(q
        ? { name: { contains: q, mode: "insensitive" as const } }
        : {}),
      ...(state === "active"
        ? { active: true }
        : state === "inactive"
          ? { active: false }
          : {}),
    },
    orderBy:
      sort === "price"
        ? { priceCents: "asc" }
        : sort === "category"
          ? { category: "asc" }
          : { name: "asc" },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Product catalogue</h1>
        <Link
          href="/admin/catalogue/new"
          className="min-h-10 rounded bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          New product
        </Link>
      </div>
      <Form
        action="/admin/catalogue"
        className="mb-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="min-h-10 rounded border p-2"
        />
        <select
          name="state"
          defaultValue={state}
          className="min-h-10 rounded border p-2"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="min-h-10 rounded border p-2"
        >
          <option value="name">Name</option>
          <option value="category">Category</option>
          <option value="price">Price</option>
        </select>
        <button className="min-h-10 rounded bg-zinc-900 px-3 text-white">
          Apply
        </button>
      </Form>
      {products.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="px-3">Variant</th>
                <th className="px-3">Category</th>
                <th className="px-3">Source</th>
                <th className="px-3">State</th>
                <th className="py-2 pl-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  data-testid="admin-product-row"
                  className="border-t hover:bg-zinc-50"
                >
                  <td className="py-3 pr-3">
                    <Link
                      href={`/admin/catalogue/${product.id}/edit`}
                      className="font-medium text-blue-700 underline"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-3">{product.variantName ?? "—"}</td>
                  <td className="px-3">{product.category ?? "—"}</td>
                  <td className="px-3">
                    {product.source === "SYNCED" ? "Synced" : "Manual"}
                  </td>
                  <td className="px-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${product.active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-600"}`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    {formatAud(product.priceCents)}
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
