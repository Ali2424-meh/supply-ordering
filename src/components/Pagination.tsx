import Link from "next/link";

type Query = Record<string, string | undefined>;

function pageHref(pathname: string, query: Query, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function Pagination({
  pathname,
  query,
  page,
  totalPages,
  totalItems,
  pageSize,
}: {
  pathname: string;
  query: Query;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}) {
  if (totalItems === 0 || totalPages <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  const linkClass =
    "inline-flex min-h-10 items-center rounded-lg border bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50";

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-between gap-3 border-t pt-4"
    >
      <p className="hidden text-sm text-zinc-500 sm:block">
        Showing {first.toLocaleString()}–{last.toLocaleString()} of{" "}
        {totalItems.toLocaleString()}
      </p>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        {page > 1 ? (
          <Link
            href={pageHref(pathname, query, page - 1)}
            className={linkClass}
            rel="prev"
            aria-label="Previous page"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">← Previous</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${linkClass} cursor-not-allowed opacity-40`}
          >
            ← Previous
          </span>
        )}
        <span className="px-1 text-sm text-zinc-500" aria-current="page">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={pageHref(pathname, query, page + 1)}
            className={linkClass}
            rel="next"
            aria-label="Next page"
          >
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">Next →</span>
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${linkClass} cursor-not-allowed opacity-40`}
          >
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}
