import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { RefreshCatalogueButton } from "@/components/RefreshCatalogueButton";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Started</th>
                <th className="px-3">Status</th>
                <th className="px-3">Added</th>
                <th className="px-3">Updated</th>
                <th className="px-3">Deactivated</th>
                <th className="py-2 pl-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} data-testid="import-row" className="border-t">
                  <td className="py-3 pr-3">
                    {run.startedAt.toLocaleString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })}
                  </td>
                  <td className="px-3">{run.status}</td>
                  <td className="px-3">{run.added}</td>
                  <td className="px-3">{run.updated}</td>
                  <td className="px-3">{run.deactivated}</td>
                  <td className="py-3 pl-3 text-red-600">
                    {run.errorMessage ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
