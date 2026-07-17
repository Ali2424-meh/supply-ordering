"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatAud } from "@/lib/format";
import { QuickAdd } from "@/components/QuickAdd";

type GridProduct = {
  id: string;
  name: string;
  variantName: string | null;
  category: string | null;
  imageUrl: string | null;
  priceCents: number;
};

export function ProductGrid({ products }: { products: GridProduct[] }) {
  const groups = new Map<string, GridProduct[]>();
  for (const product of products) {
    const category = product.category ?? "Other supplies";
    const group = groups.get(category);
    if (group) group.push(product);
    else groups.set(category, [product]);
  }

  return (
    <div className="space-y-6">
      {[...groups].map(([category, items], groupIndex) => (
        <section key={category} aria-labelledby={`category-${groupIndex}`}>
          <h2
            id={`category-${groupIndex}`}
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500"
          >
            {category}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((product, index) => (
              <motion.li
                key={product.id}
                data-testid="product-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{
                  delay: Math.min(index, 12) * 0.06,
                  duration: 0.25,
                }}
              >
                <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-2 shadow-sm transition-shadow hover:border-zinc-300 hover:shadow-md sm:p-3">
                  <Link
                    href={`/supplies/catalogue/${product.id}`}
                    className="flex flex-col"
                  >
                    <div className="mb-2 overflow-hidden rounded-lg bg-zinc-100">
                      <motion.img
                        layoutId={`product-image-${product.id}`}
                        src={product.imageUrl ?? "/placeholder.svg"}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.src = "/placeholder.svg";
                        }}
                        className="aspect-square w-full object-contain transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <p className="text-sm font-medium">{product.name}</p>
                    {product.variantName && (
                      <p className="text-xs text-zinc-500">
                        {product.variantName}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {formatAud(product.priceCents)}
                    </p>
                  </Link>
                  <QuickAdd productId={product.id} imageUrl={product.imageUrl} />
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
