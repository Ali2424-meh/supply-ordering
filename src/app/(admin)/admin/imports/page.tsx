import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { RefreshCatalogueButton } from "@/components/RefreshCatalogueButton";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export const metadata: Metadata = { title: "Import history" };

export default async function ImportsPage() {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  const runs = await prisma.importRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Catalogue import history</h1>
      <RefreshCatalogueButton />
      {runs.length === 0 ? (
        <EmptyState title="No imports yet" />
      ) : (
        <>
          <ul className="grid gap-2 md:hidden">
            {runs.map((run) => (
              <li
                key={run.id}
                className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {run.startedAt.toLocaleString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${run.status === "SUCCEEDED" ? "bg-emerald-100 text-emerald-800" : run.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
                  >
                    {run.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><dt className="text-zinc-500">Added</dt><dd className="font-semibold">{run.added}</dd></div>
                  <div><dt className="text-zinc-500">Updated</dt><dd className="font-semibold">{run.updated}</dd></div>
                  <div><dt className="text-zinc-500">Inactive</dt><dd className="font-semibold">{run.deactivated}</dd></div>
                </dl>
                {run.errorMessage && (
                  <p className="mt-3 break-words text-xs text-red-600">
                    {run.errorMessage}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white px-4 shadow-sm md:block">
            <table className="w-full min-w-4xl text-sm">
              <thead className="text-left text-zinc-500">
                <tr>
                  <th scope="col" className="py-3 pr-3">Started</th>
                  <th scope="col" className="px-3">Status</th>
                  <th scope="col" className="px-3">Added</th>
                  <th scope="col" className="px-3">Updated</th>
                  <th scope="col" className="px-3">Deactivated</th>
                  <th scope="col" className="py-3 pl-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} data-testid="import-row" className="border-t border-zinc-200">
                    <td className="py-3 pr-3">
                      {run.startedAt.toLocaleString("en-AU", {
                        timeZone: "Australia/Sydney",
                      })}
                    </td>
                    <td className="px-3">{run.status}</td>
                    <td className="px-3">{run.added}</td>
                    <td className="px-3">{run.updated}</td>
                    <td className="px-3">{run.deactivated}</td>
                    <td className="max-w-sm break-words py-3 pl-3 text-red-600">
                      {run.errorMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
