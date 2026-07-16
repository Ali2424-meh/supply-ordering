import { prisma } from "@/lib/prisma";
import type { Product } from "@prisma/client";
import type { CatalogueLine } from "./shopify";

function catalogueChanged(product: Product, line: CatalogueLine): boolean {
  return (
    !product.active ||
    product.source !== "SYNCED" ||
    product.name !== line.name ||
    product.variantName !== line.variantName ||
    product.category !== line.category ||
    product.description !== line.description ||
    product.imageUrl !== line.imageUrl ||
    product.priceCents !== line.priceCents ||
    product.sku !== line.sku ||
    product.unitSize !== line.unitSize ||
    product.productUrl !== line.productUrl
  );
}

export async function applyCatalogueLines(
  lines: CatalogueLine[],
): Promise<{ added: number; updated: number; deactivated: number }> {
  return prisma.$transaction(
    async (tx) => {
      let added = 0;
      let updated = 0;
      const uniqueLines = [
        ...new Map(
          lines.map((line) => [line.shopifyVariantId, line] as const),
        ).values(),
      ];
      const seen = uniqueLines.map((line) => line.shopifyVariantId);
      const existingProducts = await tx.product.findMany({
        where: { shopifyVariantId: { in: seen } },
      });
      const existingByVariant = new Map(
        existingProducts.map((product) => [product.shopifyVariantId!, product]),
      );

      for (const line of uniqueLines) {
        const existing = existingByVariant.get(line.shopifyVariantId);
        if (!existing) {
          await tx.product.create({
            data: {
              ...line,
              active: true,
              source: "SYNCED",
              priceHistory: { create: { priceCents: line.priceCents } },
            },
          });
          added += 1;
        } else if (catalogueChanged(existing, line)) {
          await tx.product.update({
            where: { id: existing.id },
            data: { ...line, active: true, source: "SYNCED" },
          });
          if (existing.priceCents !== line.priceCents) {
            await tx.priceHistory.create({
              data: { productId: existing.id, priceCents: line.priceCents },
            });
          }
          updated += 1;
        }
      }

      const { count: deactivated } = await tx.product.updateMany({
        where: {
          source: "SYNCED",
          active: true,
          shopifyVariantId: { notIn: seen },
        },
        data: { active: false },
      });
      return { added, updated, deactivated };
    },
    { timeout: 900_000 },
  );
}
