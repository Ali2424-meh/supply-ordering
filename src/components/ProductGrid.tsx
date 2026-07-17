"use client";

import { useState } from "react";
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

/**
 * One card per product name; sibling variants (e.g. 500ML/5L/20L) collapse
 * into a picker. Each variant is still its own catalogue line underneath.
 */
function ProductCard({ variants }: { variants: GridProduct[] }) {
  const [selectedId, setSelectedId] = useState(variants[0].id);
  const selected =
    variants.find((variant) => variant.id === selectedId) ?? variants[0];

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-2 transition-shadow hover:border-zinc-300 hover:shadow-md sm:p-3">
      <Link
        href={`/supplies/catalogue/${selected.id}`}
        className="flex flex-col"
      >
        <div className="mb-2 overflow-hidden rounded-lg bg-zinc-100">
          <motion.img
            layoutId={`product-image-${selected.id}`}
            src={selected.imageUrl ?? "/placeholder.svg"}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.svg";
            }}
            className="aspect-square w-full object-contain transition-transform duration-300 hover:scale-105"
          />
        </div>
        <p className="text-sm font-medium">{selected.name}</p>
      </Link>
      {variants.length > 1 ? (
        <select
          aria-label={`Variant of ${selected.name}`}
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.variantName ?? "Standard"} —{" "}
              {formatAud(variant.priceCents)}
            </option>
          ))}
        </select>
      ) : (
        selected.variantName && (
          <p className="text-xs text-zinc-500">{selected.variantName}</p>
        )
      )}
      <p className="mt-1 text-sm font-semibold text-zinc-900">
        {formatAud(selected.priceCents)}
      </p>
      <div className="mt-auto">
        <QuickAdd productId={selected.id} imageUrl={selected.imageUrl} />
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: GridProduct[] }) {
  const groups = new Map<string, Map<string, GridProduct[]>>();
  for (const product of products) {
    const category = product.category ?? "Other supplies";
    let byName = groups.get(category);
    if (!byName) {
      byName = new Map();
      groups.set(category, byName);
    }
    const variants = byName.get(product.name);
    if (variants) variants.push(product);
    else byName.set(product.name, [product]);
  }

  return (
    <div className="space-y-6">
      {[...groups].map(([category, byName], groupIndex) => (
        <section key={category} aria-labelledby={`category-${groupIndex}`}>
          <h2
            id={`category-${groupIndex}`}
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500"
          >
            {category}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...byName].map(([name, variants], index) => (
              <motion.li
                key={name}
                data-testid="product-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{
                  delay: Math.min(index, 12) * 0.06,
                  duration: 0.25,
                }}
              >
                <ProductCard variants={variants} />
              </motion.li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
