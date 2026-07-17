import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader
        eyebrow="Supply"
        title="Catalogue import history"
        description="Each refresh adds, updates, or deactivates products from cleanersgallery.com.au."
      />
      <RefreshCatalogueButton />
      {runs.length === 0 ? (
        <EmptyState title="No imports yet" />
      ) : (
        <>
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:hidden">
            {runs.map((run) => (
              <li
                key={run.id}
                className="p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {run.startedAt.toLocaleString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${run.status === "SUCCEEDED" ? "bg-brand-tint text-brand-deep" : run.status === "FAILED" ? "bg-danger-tint text-danger" : "bg-warning-tint text-warning"}`}
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
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:block">
            <table className="w-full table-fixed text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="py-3 pl-4 pr-3">Started</th>
                  <th scope="col" className="px-3">Status</th>
                  <th scope="col" className="px-3 xl:hidden">Changes</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Added</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Updated</th>
                  <th scope="col" className="hidden px-3 xl:table-cell">Deactivated</th>
                  <th scope="col" className="hidden py-3 pl-3 pr-4 xl:table-cell">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {runs.map((run) => (
                  <tr key={run.id} data-testid="import-row" className="transition hover:bg-zinc-50">
                    <td className="py-3 pl-4 pr-3 text-zinc-700">
                      {run.startedAt.toLocaleString("en-AU", {
                        timeZone: "Australia/Sydney",
                      })}
                    </td>
                    <td className="px-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${run.status === "SUCCEEDED" ? "bg-brand-tint text-brand-deep" : run.status === "FAILED" ? "bg-danger-tint text-danger" : "bg-warning-tint text-warning"}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 text-xs text-zinc-600 xl:hidden">
                      +{run.added} · {run.updated} updated · {run.deactivated} inactive
                      {run.errorMessage && (
                        <span className="mt-1 block break-words text-danger">
                          {run.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-3 font-medium xl:table-cell">{run.added}</td>
                    <td className="hidden px-3 font-medium xl:table-cell">{run.updated}</td>
                    <td className="hidden px-3 font-medium xl:table-cell">{run.deactivated}</td>
                    <td className="hidden max-w-sm break-words py-3 pl-3 pr-4 text-red-600 xl:table-cell">
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
