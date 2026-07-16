import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("CLEANER");
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  return (
    <article className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Product images may come from manually configured external hosts; keep
          them browser-fetched instead of widening the server image allowlist. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl ?? "/placeholder.svg"}
        alt={product.name}
        className="mb-4 aspect-square w-full rounded-xl bg-zinc-100 object-contain"
        id="product-hero"
      />
      <h1 className="text-xl font-semibold">{product.name}</h1>
      {product.variantName && (
        <p className="text-zinc-500">{product.variantName}</p>
      )}
      {product.unitSize && product.unitSize !== product.variantName && (
        <p className="text-sm text-zinc-500">Unit size: {product.unitSize}</p>
      )}
      {product.category && (
        <p className="text-xs uppercase text-zinc-400">{product.category}</p>
      )}
      <p className="my-2 text-lg font-bold">{formatAud(product.priceCents)}</p>
      {product.description && (
        <p className="mb-4 text-sm text-zinc-600">{product.description}</p>
      )}
      <AddToCartButton productId={product.id} imageUrl={product.imageUrl} />
      {product.productUrl && (
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-blue-700 underline decoration-blue-200 underline-offset-2"
        >
          View on cleanersgallery.com.au
        </a>
      )}
    </article>
  );
}
