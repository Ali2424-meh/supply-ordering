import { PackageOpen } from "lucide-react";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-8 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand">
        <PackageOpen size={24} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="font-medium text-zinc-700">{title}</p>
      {hint && <p className="text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}
