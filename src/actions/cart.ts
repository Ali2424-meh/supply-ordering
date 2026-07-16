"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clampQuantity } from "@/lib/cart";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1);

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  const qty = clampQuantity(z.number().parse(quantity));
  const product = await prisma.product.findUnique({ where: { id: pid } });
  if (!product || !product.active) {
    throw new Error("This product is not available.");
  }
  // Keep the merge and upper bound in one statement so concurrent additions
  // cannot leave a cart line above the documented maximum.
  await prisma.$executeRaw`
    INSERT INTO "CartItem" AS cart ("id", "userId", "productId", "quantity")
    VALUES (${crypto.randomUUID()}, ${user.id}, ${pid}, ${qty})
    ON CONFLICT ("userId", "productId") DO UPDATE
    SET "quantity" = LEAST(999, cart."quantity" + EXCLUDED."quantity")
  `;
  revalidatePath("/supplies", "layout");
}

export async function setCartQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  await prisma.cartItem.update({
    where: { userId_productId: { userId: user.id, productId: pid } },
    data: { quantity: clampQuantity(z.number().parse(quantity)) },
  });
  revalidatePath("/supplies", "layout");
}

export async function removeFromCart(productId: string): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  await prisma.cartItem.deleteMany({
    where: { userId: user.id, productId: pid },
  });
  revalidatePath("/supplies", "layout");
}
