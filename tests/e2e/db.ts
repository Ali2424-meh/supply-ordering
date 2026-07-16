import { PrismaClient } from "@prisma/client";

const E2E_DB = "postgresql://supply:supply@localhost:5432/supply_e2e";

export async function setProductActive(id: string, active: boolean) {
  const db = new PrismaClient({ datasources: { db: { url: E2E_DB } } });
  try {
    await db.product.update({ where: { id }, data: { active } });
  } finally {
    await db.$disconnect();
  }
}
