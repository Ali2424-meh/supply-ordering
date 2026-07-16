"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { clampQuantity } from "@/lib/cart";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().min(1);

async function lockCartContext(tx: Prisma.TransactionClient, userId: string) {
  // Cart mutations and submission take the same user-row lock. This prevents
  // an add/update from being silently deleted by a concurrent submission.
  const [user] = await tx.$queryRaw<Array<{ role: Role; disabled: boolean }>>`
    SELECT "role", "disabled" FROM "User"
    WHERE "id" = ${userId}
    FOR UPDATE
  `;
  if (!user) throw new Error("Not signed in.");
  if (user.role !== "CLEANER") throw new Error("Not allowed.");
  if (user.disabled) throw new Error("Your account is disabled.");
  const [feature] = await tx.$queryRaw<Array<{ value: string }>>`
    SELECT "value" FROM "Setting"
    WHERE "key" = 'supplyOrderingEnabled'
    FOR SHARE
  `;
  if (feature?.value !== "true") {
    throw new Error("Supply ordering is currently disabled.");
  }
}

export async function addToCart(
  productId: string,
  quantity: number,
): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  const qty = clampQuantity(z.number().parse(quantity));
  await prisma.$transaction(async (tx) => {
    await lockCartContext(tx, user.id);
    const [product] = await tx.$queryRaw<Array<{ active: boolean }>>`
      SELECT "active" FROM "Product"
      WHERE "id" = ${pid}
      FOR SHARE
    `;
    if (!product?.active) throw new Error("This product is not available.");
    // Keep the merge and upper bound in one statement so concurrent additions
    // cannot leave a cart line above the documented maximum.
    await tx.$executeRaw`
      INSERT INTO "CartItem" AS cart ("id", "userId", "productId", "quantity")
      VALUES (${crypto.randomUUID()}, ${user.id}, ${pid}, ${qty})
      ON CONFLICT ("userId", "productId") DO UPDATE
      SET "quantity" = LEAST(999, cart."quantity" + EXCLUDED."quantity")
    `;
  });
  revalidatePath("/supplies", "layout");
}

export async function setCartQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  const qty = clampQuantity(z.number().parse(quantity));
  await prisma.$transaction(async (tx) => {
    await lockCartContext(tx, user.id);
    await tx.cartItem.update({
      where: { userId_productId: { userId: user.id, productId: pid } },
      data: { quantity: qty },
    });
  });
  revalidatePath("/supplies", "layout");
}

export async function removeFromCart(productId: string): Promise<void> {
  const user = await guardAction(["CLEANER"]);
  const pid = idSchema.parse(productId);
  await prisma.$transaction(async (tx) => {
    await lockCartContext(tx, user.id);
    await tx.cartItem.deleteMany({
      where: { userId: user.id, productId: pid },
    });
  });
  revalidatePath("/supplies", "layout");
}
