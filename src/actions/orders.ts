"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cartTotalCents, findInvalidLines } from "@/lib/cart";
import { sendOrderSubmittedEmail } from "@/lib/email/send";
import { formatOrderNumber } from "@/lib/format";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma, type Role } from "@prisma/client";

export type SubmitResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string; invalidProductIds?: string[] };

const statusSchema = z.nativeEnum(OrderStatus);
const noteSchema = z.string().trim().max(2_000, "Notes must be 2,000 characters or fewer.");
const MAX_DATABASE_INT = 2_147_483_647;

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

    const cartLines = await tx.cartItem.findMany({
      where: { userId: user.id },
      select: { productId: true },
    });
    if (cartLines.length === 0) {
      return { ok: false as const, error: "Your cart is empty." };
    }

    // Hold shared locks until the order commits so catalogue sync cannot
    // deactivate or reprice a line between validation and snapshot creation.
    await tx.$queryRaw`
      SELECT "id" FROM "Product"
      WHERE "id" IN (${Prisma.join(cartLines.map((item) => item.productId))})
      FOR SHARE
    `;
    const cart = await tx.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

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
    if (totalCents > MAX_DATABASE_INT) {
      return {
        ok: false as const,
        error: "Your cart total is too large. Please reduce the quantities.",
      };
    }

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
    return {
      ok: true as const,
      orderNumber,
      email: {
        orderNumber,
        workerName: user.name,
        workerEmail: user.email,
        items: cart.map((item) => ({
          name: item.product.name,
          variant: item.product.variantName,
          quantity: item.quantity,
          priceCents: item.product.priceCents,
        })),
        totalCents,
      },
    };
  });

  if (outcome.ok) {
    try {
      await sendOrderSubmittedEmail(outcome.email);
    } catch (error) {
      console.error("order email failed", error);
    }
    revalidatePath("/supplies", "layout");
    return { ok: true, orderNumber: outcome.orderNumber };
  }
  return outcome;
}

export async function updateOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  note?: string,
): Promise<void> {
  const actor = await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const target = statusSchema.parse(toStatus);
  // noteSchema trims; `|| null` then coerces a whitespace-only note to null.
  const trimmedNote = note == null ? null : noteSchema.parse(note) || null;

  await prisma.$transaction(async (tx) => {
    const [order] = await tx.$queryRaw<
      Array<{ id: string; status: OrderStatus }>
    >`
      SELECT "id", "status" FROM "Order"
      WHERE "id" = ${orderId}
      FOR UPDATE
    `;
    if (!order) throw new Error("Order not found.");
    await tx.order.update({
      where: { id: order.id },
      data: { status: target },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: target,
        note: trimmedNote,
        actorId: actor.id,
      },
    });
  });
  revalidatePath("/admin/orders", "layout");
  revalidatePath("/supplies", "layout");
}
