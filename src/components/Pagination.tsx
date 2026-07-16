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
  if (totalItems === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  const linkClass =
    "inline-flex min-h-10 items-center rounded-lg border bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50";

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
    >
      <p className="text-sm text-zinc-500">
        Showing {first.toLocaleString()}–{last.toLocaleString()} of{" "}
        {totalItems.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={pageHref(pathname, query, page - 1)}
            className={linkClass}
            rel="prev"
          >
            ← Previous
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
          >
            Next →
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
