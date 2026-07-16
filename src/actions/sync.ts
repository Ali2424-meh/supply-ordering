"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { guardAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { applyCatalogueLines } from "@/lib/sync/apply";
import { fetchAllCatalogueLines } from "@/lib/sync/shopify";

const LOCK_KEY = 823451;

function lockDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required.");
  const url = new URL(raw);
  // A one-connection pool guarantees lock and unlock use the same PostgreSQL
  // session. The regular shared Prisma pool cannot make that guarantee.
  url.searchParams.set("connection_limit", "1");
  return url.toString();
}

export async function refreshCatalogue(): Promise<{
  ok: boolean;
  message: string;
}> {
  await guardAction(["SUPPLY_MANAGER", "ADMIN"]);
  const lockClient = new PrismaClient({
    datasources: { db: { url: lockDatabaseUrl() } },
  });
  let locked = false;

  try {
    [{ locked }] = await lockClient.$queryRaw<[{ locked: boolean }]>`
      SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked
    `;
    if (!locked) {
      return {
        ok: false,
        message: "A catalogue refresh is already in progress.",
      };
    }

    // A session lock disappears automatically if its process is interrupted.
    // Any RUNNING rows left behind by that event are historical failures.
    await prisma.importRun.updateMany({
      where: { status: "RUNNING" },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: "Import was interrupted before completion.",
      },
    });

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
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      return {
        ok: false,
        message: "Catalogue refresh failed. See import history.",
      };
    }
  } finally {
    try {
      if (locked) {
        await lockClient.$queryRaw`
          SELECT pg_advisory_unlock(${LOCK_KEY})
        `;
      }
    } finally {
      await lockClient.$disconnect();
    }
  }
}
