"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@prisma/client";
import { formatAud } from "@/lib/format";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((product, index) => (
        <motion.li
          key={product.id}
          data-testid="product-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index, 12) * 0.06, duration: 0.25 }}
        >
          <Link
            href={`/supplies/catalogue/${product.id}`}
            className="block h-full rounded-lg border p-2 transition-shadow hover:shadow-md sm:p-3"
          >
            <motion.img
              layoutId={`product-image-${product.id}`}
              src={product.imageUrl ?? "/placeholder.svg"}
              alt=""
              className="mb-2 aspect-square w-full rounded bg-zinc-100 object-cover"
            />
            <p className="text-sm font-medium">{product.name}</p>
            {product.variantName && (
              <p className="text-xs text-zinc-500">{product.variantName}</p>
            )}
            <p className="mt-1 text-sm font-semibold">
              {formatAud(product.priceCents)}
            </p>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}
