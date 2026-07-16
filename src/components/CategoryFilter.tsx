"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function CategoryFilter({
  categories,
  active,
  q,
}: {
  categories: string[];
  active: string;
  q: string;
}) {
  const chips = ["", ...categories];
  const href = (category: string) => {
    const query = new URLSearchParams({
      ...(q && { q }),
      ...(category && { category }),
    });
    return query.size > 0
      ? `/supplies/catalogue?${query}`
      : "/supplies/catalogue";
  };

  return (
    <div className="mb-4 flex flex-wrap gap-1">
      {chips.map((category) => {
        const isActive = category === active;
        return (
          <Link
            key={category || "all"}
            href={href(category)}
            className="relative min-h-9 rounded-full px-3 py-2 text-sm"
          >
            {isActive && (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-zinc-900"
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
    </div>
  );
}
