import { notFound } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Edit {product.name}</h1>
      {product.source === "SYNCED" && (
        <p className="mb-4 text-xs text-amber-700">
          Synced from the external store — the next catalogue refresh will
          reassert store data.
        </p>
      )}
      <ProductForm
        productId={product.id}
        initial={{
          name: product.name,
          variantName: product.variantName,
          category: product.category,
          description: product.description,
          imageUrl: product.imageUrl,
          priceCents: product.priceCents,
          sku: product.sku,
          unitSize: product.unitSize,
          productUrl: product.productUrl,
          active: product.active,
        }}
      />
    </div>
  );
}
