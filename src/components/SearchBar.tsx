"use client";

import { useRef, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  defaultValue,
  category,
}: {
  defaultValue: string;
  category: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim().slice(0, 200));
      } else {
        params.delete("q");
      }
      // Reset to page 1 when searching
      params.delete("page");
      // Preserve category param
      if (category) {
        params.set("category", category);
      }
      startTransition(() => {
        router.replace(`/supplies/catalogue?${params.toString()}`);
      });
    }, 300);
  }

  return (
    <div className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="Search name, variant or SKU…"
        maxLength={200}
        onChange={handleChange}
        className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Search products"
        type="search"
      />
    </div>
  );
}
