"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatAud } from "@/lib/format";

type VariantOption = {
  id: string;
  variantName: string | null;
  priceCents: number;
};

export function ProductVariantPicker({
  productName,
  currentId,
  variants,
}: {
  productName: string;
  currentId: string;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const useSelectOnWideScreens = variants.length > 8;

  return (
    <div className="mt-5 border-t border-zinc-100 pt-4">
      <label
        className={`${useSelectOnWideScreens ? "block" : "block sm:hidden"}`}
      >
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Choose a variant
        </span>
        <select
          aria-label={`Variant of ${productName}`}
          value={currentId}
          onChange={(event) =>
            router.push(`/supplies/catalogue/${event.target.value}`)
          }
          className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.variantName ?? "Standard"} — {formatAud(variant.priceCents)}
            </option>
          ))}
        </select>
      </label>

      {!useSelectOnWideScreens && (
        <div className="hidden sm:block">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Choose a variant
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {variants.map((variant) => {
              const isCurrent = variant.id === currentId;
              return (
                <li key={variant.id}>
                  <Link
                    href={`/supplies/catalogue/${variant.id}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm transition ${
                      isCurrent
                        ? "border-brand bg-brand text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-brand/40 hover:text-brand"
                    }`}
                  >
                    {variant.variantName ?? "Standard"}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
