import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const E2E_DB = "postgresql://supply:supply@localhost:5432/supply_e2e";

export default async function globalSetup() {
  rmSync(".email-capture-e2e", { recursive: true, force: true });
  execSync("npx prisma migrate reset --force --skip-generate", {
    env: { ...process.env, DATABASE_URL: E2E_DB },
    stdio: "inherit",
  });

  const db = new PrismaClient({ datasources: { db: { url: E2E_DB } } });
  try {
    const cleaner = await db.user.findUniqueOrThrow({
      where: { email: "cleaner@example.com" },
    });
    const disabled = await db.user.findUniqueOrThrow({
      where: { email: "disabled@example.com" },
    });
    const product = await db.product.findUniqueOrThrow({
      where: { shopifyVariantId: "seed-1" },
    });

    await db.order.create({
      data: {
        orderNumber: "OR-SEED",
        userId: cleaner.id,
        status: "SUBMITTED",
        totalCents: product.priceCents,
        items: {
          create: {
            productId: product.id,
            nameSnapshot: product.name,
            variantSnapshot: product.variantName,
            priceCentsSnapshot: product.priceCents,
            quantity: 1,
          },
        },
        events: {
          create: { toStatus: "SUBMITTED", actorId: cleaner.id },
        },
      },
    });
    await db.cartItem.create({
      data: { userId: disabled.id, productId: product.id, quantity: 1 },
    });
  } finally {
    await db.$disconnect();
  }
}
