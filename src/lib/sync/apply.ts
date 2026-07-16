import { prisma } from "@/lib/prisma";
import type { CatalogueLine } from "./shopify";

export async function applyCatalogueLines(
  lines: CatalogueLine[],
): Promise<{ added: number; updated: number; deactivated: number }> {
  return prisma.$transaction(
    async (tx) => {
      let added = 0;
      let updated = 0;
      const seen: string[] = [];

      for (const line of lines) {
        seen.push(line.shopifyVariantId);
        const existing = await tx.product.findUnique({
          where: { shopifyVariantId: line.shopifyVariantId },
        });
        if (!existing) {
          const created = await tx.product.create({
            data: { ...line, active: true, source: "SYNCED" },
          });
          await tx.priceHistory.create({
            data: { productId: created.id, priceCents: line.priceCents },
          });
          added += 1;
        } else {
          await tx.product.update({
            where: { id: existing.id },
            data: { ...line, active: true },
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
