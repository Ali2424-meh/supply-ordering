"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** ADMIN only. Deliberately bypasses guardAction so a disabled feature can be re-enabled. */
export async function toggleSupplyAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN" || user.disabled) {
    throw new Error("Not allowed.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "key" FROM "Setting"
      WHERE "key" = 'supplyOrderingEnabled'
      FOR UPDATE
    `;
    const current = await tx.setting.findUnique({
      where: { key: "supplyOrderingEnabled" },
    });
    await tx.setting.upsert({
      where: { key: "supplyOrderingEnabled" },
      update: { value: String(current?.value !== "true") },
      create: { key: "supplyOrderingEnabled", value: "true" },
    });
  });
  revalidatePath("/", "layout");
}
