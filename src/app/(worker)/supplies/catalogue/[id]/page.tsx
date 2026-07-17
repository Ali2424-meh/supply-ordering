import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClipboardCheck,
  ExternalLink,
  PhoneCall,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductVariantPicker } from "@/components/ProductVariantPicker";
import { formatAud } from "@/lib/format";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { panel } from "@/lib/ui";

const REASSURANCE = [
  {
    icon: ShieldCheck,
    text: "No payment is taken in the app.",
  },
  {
    icon: PhoneCall,
    text: "Operations confirms your request and arranges payment.",
  },
  {
    icon: ClipboardCheck,
    text: "Track progress any time from My orders.",
  },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("CLEANER");
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.active) notFound();

  // Sibling variants share the product name; each stays its own catalogue line.
  const [variants, related] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, name: product.name },
      orderBy: [{ priceCents: "asc" }, { id: "asc" }],
      select: { id: true, variantName: true, priceCents: true },
    }),
    product.category
      ? prisma.product.findMany({
          where: {
            active: true,
            category: product.category,
            NOT: { name: product.name },
          },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          take: 5,
          select: {
            id: true,
            name: true,
            variantName: true,
            imageUrl: true,
            priceCents: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return (
    <article>
      {/* Breadcrumb */}
      <nav className="mb-4 flex min-w-0 items-center text-xs text-zinc-400">
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
        <span className="truncate text-zinc-600">{product.name}</span>
      </nav>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-8 lg:gap-10">
        {/* Gallery panel */}
        <div className={`${panel()} p-4 sm:p-6`}>
          <div className="rounded-xl bg-gradient-to-br from-brand-tint via-white to-zinc-50 p-6">
            {/* Product images may come from manually configured external hosts; keep
                them browser-fetched instead of widening the server image allowlist. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl ?? "/placeholder.svg"}
              alt={product.name}
              className="mx-auto aspect-square w-full max-w-md object-contain transition-transform duration-300 hover:scale-[1.03]"
              id="product-hero"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
            {product.sku ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                SKU {product.sku}
              </span>
            ) : (
              <span />
            )}
            <span>
              {product.source === "SYNCED"
                ? "Synced from cleanersgallery.com.au"
                : "Managed by your supply team"}
            </span>
          </div>
        </div>

        {/* Purchase panel */}
        <div className="self-start lg:sticky lg:top-24">
          {product.category && (
            <Link
              href={`/supplies/catalogue?category=${encodeURIComponent(product.category)}`}
              className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand hover:bg-brand-soft"
            >
              <Tag size={11} aria-hidden="true" />
              {product.category}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {product.name}
          </h1>
          {product.variantName && (
            <p className="mt-0.5 text-zinc-500">{product.variantName}</p>
          )}
          <p className="mt-3 text-3xl font-bold text-zinc-900">
            {formatAud(product.priceCents)}
            {product.unitSize && (
              <span className="ml-1.5 text-sm font-normal text-zinc-500">
                / {product.unitSize}
              </span>
            )}
          </p>

          {variants.length > 1 && (
            <ProductVariantPicker
              productName={product.name}
              currentId={product.id}
              variants={variants}
            />
          )}

          <div className="mt-5">
            <AddToCartButton productId={product.id} imageUrl={product.imageUrl} />
          </div>

          <ul className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100">
            {REASSURANCE.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 py-2.5 text-sm text-zinc-600">
                <Icon size={15} className="shrink-0 text-brand" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:text-brand-hover"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View on cleanersgallery.com.au
            </a>
          )}
        </div>
      </div>

      {/* Details + specifications */}
      <div className="mt-8 grid items-start gap-6 md:grid-cols-[2fr_1fr]">
        <section className={`${panel()} p-5 sm:p-6`} aria-labelledby="details-heading">
          <h2 id="details-heading" className="mb-2 text-base font-semibold">
            Details
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600">
            {product.description ??
              "No description has been added for this product yet. The supply team can tell you more when they confirm your request."}
          </p>
        </section>
        <section className={`${panel()} overflow-hidden`} aria-labelledby="specs-heading">
          <h2
            id="specs-heading"
            className="border-b border-zinc-100 px-5 py-3 text-base font-semibold"
          >
            Specifications
          </h2>
          <dl className="divide-y divide-zinc-100 text-sm">
            {[
              ["SKU", product.sku],
              ["Unit size", product.unitSize],
              ["Category", product.category],
              ["Variant", product.variantName],
              ["Availability", "In catalogue"],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 px-5 py-2.5">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="text-right font-medium text-zinc-800">{value}</dd>
                </div>
              ))}
          </dl>
        </section>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-8" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-3 text-base font-semibold">
            More in {product.category}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((item) => (
              <li key={item.id} data-testid="related-product">
                <Link
                  href={`/supplies/catalogue/${item.id}`}
                  className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-2 transition hover:border-zinc-300 hover:shadow-md sm:p-3"
                >
                  <div className="mb-2 overflow-hidden rounded-lg bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl ?? "/placeholder.svg"}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full object-contain"
                    />
                  </div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.variantName && (
                    <p className="text-xs text-zinc-500">{item.variantName}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {formatAud(item.priceCents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
