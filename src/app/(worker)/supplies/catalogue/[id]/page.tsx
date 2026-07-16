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
    <article className="mx-auto max-w-md">
      {/* Product images may come from manually configured external hosts; keep
          them browser-fetched instead of widening the server image allowlist. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl ?? "/placeholder.svg"}
        alt={product.name}
        className="mb-4 aspect-square w-full rounded-lg bg-zinc-100 object-cover"
        id="product-hero"
      />
      <h1 className="text-xl font-semibold">{product.name}</h1>
      {product.variantName && (
        <p className="text-zinc-500">{product.variantName}</p>
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
          className="mt-3 block text-sm text-blue-600 underline"
        >
          View on cleanersgallery.com.au
        </a>
      )}
    </article>
  );
}
