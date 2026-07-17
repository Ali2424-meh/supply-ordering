"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

const COLLAPSED_COUNT = 12;

export function CategoryFilter({
  categories,
  active,
  q,
}: {
  categories: string[];
  active: string;
  q: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const chips = ["", ...categories];
  const href = (category: string) => {
    const query = new URLSearchParams({
      ...(q && { q }),
      ...(category && { category }),
    });
    return query.size > 0
      ? `/supplies/catalogue?${query}`
      : `/supplies/catalogue`;
  };

  // Keep the active category visible even while collapsed.
  const overflowing = chips.length > COLLAPSED_COUNT + 1;
  const visible =
    expanded || !overflowing
      ? chips
      : chips.filter(
          (category, index) => index < COLLAPSED_COUNT || category === active,
        );
  const hiddenCount = chips.length - visible.length;

  return (
    <div className="mb-4">
      <label className="block sm:hidden">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Category
        </span>
        <select
          aria-label="Product category"
          value={active}
          onChange={(event) => router.push(href(event.target.value))}
          className="min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          {chips.map((category) => (
            <option key={category || "all"} value={category}>
              {category || "All categories"}
            </option>
          ))}
        </select>
      </label>

      <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
        {visible.map((category) => {
          const isActive = category === active;
          return (
            <Link
              key={category || "all"}
              href={href(category)}
              aria-current={isActive ? "page" : undefined}
              className="relative min-h-9 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm"
            >
              {isActive && (
                <motion.span
                  layoutId="category-pill"
                  className="absolute inset-0 rounded-full bg-brand shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative ${isActive ? "text-white" : "text-zinc-600"}`}
              >
                {category || "All"}
              </span>
            </Link>
          );
        })}
        {overflowing && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="min-h-9 rounded-full px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-tint"
          >
            {expanded ? "Show fewer" : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}
