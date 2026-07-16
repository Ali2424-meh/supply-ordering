"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-2.5 py-2 transition-colors ${active ? "bg-emerald-50 font-semibold text-emerald-800" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"}`}
    >
      {children}
    </Link>
  );
}
