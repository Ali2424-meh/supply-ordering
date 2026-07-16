"use server";

import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { applyCatalogueLines } from "@/lib/sync/apply";
import { fetchAllCatalogueLines } from "@/lib/sync/shopify";

const LOCK_KEY = 823451;

export async function refreshCatalogue(): Promise<{
  ok: boolean;
  message: string;
}> {
  await guardAction(["SUPPLY_MANAGER", "ADMIN"]);

  return prisma.$transaction(
    async (lockTx) => {
      const [{ locked }] = await lockTx.$queryRaw<[{ locked: boolean }]>`
        SELECT pg_try_advisory_xact_lock(${LOCK_KEY}) AS locked
      `;
      if (!locked) {
        return {
          ok: false,
          message: "A catalogue refresh is already in progress.",
        };
      }

      const run = await prisma.importRun.create({ data: { status: "RUNNING" } });
      try {
        const baseUrl =
          process.env.CATALOGUE_BASE_URL ?? "https://cleanersgallery.com.au";
        const lines = await fetchAllCatalogueLines(baseUrl);
        const counts = await applyCatalogueLines(lines);
        await prisma.importRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCEEDED",
            finishedAt: new Date(),
            ...counts,
          },
        });
        revalidatePath("/admin", "layout");
        revalidatePath("/supplies", "layout");
        return {
          ok: true,
          message: `Added ${counts.added}, updated ${counts.updated}, deactivated ${counts.deactivated}.`,
        };
      } catch (error) {
        await prisma.importRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
        });
        return {
          ok: false,
          message: "Catalogue refresh failed. See import history.",
        };
      }
    },
    { timeout: 300_000 },
  );
}
