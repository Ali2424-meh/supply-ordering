"use server";

import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import {
  productInputSchema,
  type ProductInput,
} from "@/lib/product-schema";

export async function createProduct(input: ProductInput): Promise<string> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const data = productInputSchema.parse(input);
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: { ...data, source: "MANUAL" },
    });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        entity: "Product",
        entityId: created.id,
        action: "CREATED",
        details: data,
      },
    });
    await tx.priceHistory.create({
      data: { productId: created.id, priceCents: data.priceCents },
    });
    return created;
  });
  revalidatePath("/admin/catalogue", "layout");
  return product.id;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<void> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const data = productInputSchema.parse(input);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
    const before = await tx.product.findUnique({ where: { id } });
    if (!before) throw new Error("Product not found.");
    await tx.product.update({ where: { id }, data });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        entity: "Product",
        entityId: id,
        action: "UPDATED",
        details: data,
      },
    });
    if (before.active !== data.active) {
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entity: "Product",
          entityId: id,
          action: data.active ? "ACTIVATED" : "DEACTIVATED",
        },
      });
    }
    if (before.priceCents !== data.priceCents) {
      await tx.priceHistory.create({
        data: { productId: id, priceCents: data.priceCents },
      });
    }
  });
  revalidatePath("/admin/catalogue", "layout");
  revalidatePath("/supplies", "layout");
}
