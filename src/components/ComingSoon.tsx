import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  rows: string[];
}) {
  return (
    <div>
      <PageHeader eyebrow="Platform" title={title} description={description} />
      <div className="max-w-2xl rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-6">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon size={20} aria-hidden="true" />
        </span>
        <p className="text-sm font-medium text-zinc-700">
          {title} — coming soon.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          This area is planned but not part of supply ordering yet. It will
          include:
        </p>
        <ul className="mt-3 divide-y divide-zinc-100 text-sm text-zinc-500">
          {rows.map((row) => (
            <li key={row} className="flex items-center gap-2.5 py-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-zinc-300"
                aria-hidden="true"
              />
              {row}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
