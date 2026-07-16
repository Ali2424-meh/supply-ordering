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
  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId: pid } },
    update: { quantity: { increment: qty } },
    create: { userId: user.id, productId: pid, quantity: qty },
  });
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
