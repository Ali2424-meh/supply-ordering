import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS: Array<{ name: string; email: string; role: Role; disabled?: boolean }> = [
  { name: "Cara Cleaner", email: "cleaner@example.com", role: "CLEANER" },
  { name: "Drew Disabled", email: "disabled@example.com", role: "CLEANER", disabled: true },
  { name: "Wendy Worker", email: "cleaner2@example.com", role: "CLEANER" },
  { name: "Sam Supply", email: "supply@example.com", role: "SUPPLY_MANAGER" },
  { name: "Ada Admin", email: "admin@example.com", role: "ADMIN" },
  { name: "Mia Manager", email: "manager@example.com", role: "MANAGER" },
  { name: "Casey Customer", email: "customer@example.com", role: "CUSTOMER" },
];

async function main() {
  const configuredPassword = process.env.SEED_PASSWORD?.trim();
  if (process.env.VERCEL_ENV === "production" && !configuredPassword) {
    throw new Error("SEED_PASSWORD is required when seeding production.");
  }
  const passwordHash = await bcrypt.hash(configuredPassword ?? "password123", 10);
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        disabled: u.disabled ?? false,
        ...(configuredPassword ? { passwordHash } : {}),
      },
      create: { ...u, disabled: u.disabled ?? false, passwordHash },
    });
  }
  await prisma.setting.upsert({
    where: { key: "supplyOrderingEnabled" },
    update: {},
    create: { key: "supplyOrderingEnabled", value: "true" },
  });
  await prisma.product.upsert({
    where: { shopifyVariantId: "seed-1" },
    update: {},
    create: {
      name: "Glass Cleaner 5L", variantName: "5L", category: "Chemicals",
      description: "Streak-free glass cleaner.", priceCents: 1895,
      sku: "GC-5L", productUrl: "https://cleanersgallery.com.au/products/glass-cleaner",
      active: true, source: "SYNCED", shopifyVariantId: "seed-1",
    },
  });
  await prisma.product.upsert({
    where: { shopifyVariantId: "seed-2" },
    update: {},
    create: {
      name: "Retired Mop", category: "Hardware", priceCents: 2500,
      active: false, source: "SYNCED", shopifyVariantId: "seed-2",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
