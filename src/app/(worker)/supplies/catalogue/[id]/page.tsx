import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Tag } from "lucide-react";
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
    <article className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <nav className="mb-4 text-xs text-zinc-400">
        <Link href="/supplies/catalogue" className="hover:text-brand hover:underline">
          Catalogue
        </Link>
        {product.category && (
          <>
            <span className="mx-1.5">›</span>
            <Link
              href={`/supplies/catalogue?category=${encodeURIComponent(product.category)}`}
              className="hover:text-brand hover:underline"
            >
              {product.category}
            </Link>
          </>
        )}
        <span className="mx-1.5">›</span>
        <span className="text-zinc-600">{product.name}</span>
      </nav>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        {/* Product images may come from manually configured external hosts; keep
            them browser-fetched instead of widening the server image allowlist. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl ?? "/placeholder.svg"}
          alt={product.name}
          className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 object-contain transition-transform duration-300 hover:scale-105"
          id="product-hero"
        />

        <div className="mb-4">
          {product.category && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand">
              <Tag size={11} aria-hidden="true" />
              {product.category}
            </span>
          )}
          <h1 className="mt-1 text-xl font-semibold">{product.name}</h1>
          {product.variantName && (
            <p className="text-zinc-500">{product.variantName}</p>
          )}
          {product.unitSize && product.unitSize !== product.variantName && (
            <p className="text-sm text-zinc-500">Unit size: {product.unitSize}</p>
          )}
          <p className="mt-2 text-2xl font-bold text-zinc-900">{formatAud(product.priceCents)}</p>
        </div>

        {product.description && (
          <p className="mb-4 text-sm text-zinc-600 leading-relaxed">{product.description}</p>
        )}

        <AddToCartButton productId={product.id} imageUrl={product.imageUrl} />

        {product.productUrl && (
          <a
            href={product.productUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:text-brand-hover"
          >
            <ExternalLink size={14} aria-hidden="true" />
            View on cleanersgallery.com.au
          </a>
        )}
      </div>
    </article>
  );
}
