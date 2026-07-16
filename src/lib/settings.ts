import { prisma } from "@/lib/prisma";

export async function supplyEnabled(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: "supplyOrderingEnabled" },
  });
  return setting?.value === "true";
}

export async function setSupplyEnabled(enabled: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "supplyOrderingEnabled" },
    update: { value: String(enabled) },
    create: { key: "supplyOrderingEnabled", value: String(enabled) },
  });
}
