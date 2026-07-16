"use server";

import { revalidatePath } from "next/cache";
import { cartTotalCents, findInvalidLines } from "@/lib/cart";
import { formatOrderNumber } from "@/lib/format";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type SubmitResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; invalidProductIds?: string[] };

async function notifyTeam(orderNumber: string): Promise<void> {
  // Replaced with real email in the email task.
  console.log(`[email stub] new order ${orderNumber}`);
}

export async function submitOrder(): Promise<SubmitResult> {
  const user = await guardAction(["CLEANER"]);

  const outcome = await prisma.$transaction(async (tx) => {
    // Serialize submissions for this cleaner. Without this lock, two requests
    // could both read the same non-empty cart before either clears it.
    const [freshUser] = await tx.$queryRaw<
      Array<{ role: Role; disabled: boolean }>
    >`SELECT "role", "disabled" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    if (!freshUser) throw new Error("Not signed in.");
    if (freshUser.role !== "CLEANER") throw new Error("Not allowed.");
    if (freshUser.disabled) throw new Error("Your account is disabled.");

    const [feature] = await tx.$queryRaw<Array<{ value: string }>>`
      SELECT "value" FROM "Setting"
      WHERE "key" = 'supplyOrderingEnabled'
      FOR SHARE
    `;
    if (feature?.value !== "true") {
      throw new Error("Supply ordering is currently disabled.");
    }

    const cart = await tx.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });
    if (cart.length === 0) {
      return { ok: false as const, error: "Your cart is empty." };
    }

    const invalid = findInvalidLines(
      cart.map((item) => ({ productId: item.productId })),
      cart.map((item) => ({
        id: item.product.id,
        active: item.product.active,
      })),
    );
    if (invalid.length > 0) {
      return {
        ok: false as const,
        error:
          "Some items are no longer available. Please remove them and try again.",
        invalidProductIds: invalid,
      };
    }

    const [{ nextval }] = await tx.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('order_number_seq')
    `;
    const orderNumber = formatOrderNumber(Number(nextval));
    const totalCents = cartTotalCents(
      cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceCents: item.product.priceCents,
      })),
    );

    await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "SUBMITTED",
        totalCents,
        items: {
          create: cart.map((item) => ({
            productId: item.productId,
            nameSnapshot: item.product.name,
            variantSnapshot: item.product.variantName,
            priceCentsSnapshot: item.product.priceCents,
            quantity: item.quantity,
          })),
        },
        events: {
          create: { toStatus: "SUBMITTED", actorId: user.id },
        },
      },
    });
    await tx.cartItem.deleteMany({ where: { userId: user.id } });
    return { ok: true as const, orderNumber };
  });

  if (outcome.ok) {
    try {
      await notifyTeam(outcome.orderNumber);
    } catch (error) {
      console.error("order email failed", error);
    }
    revalidatePath("/supplies", "layout");
  }
  return outcome;
}
