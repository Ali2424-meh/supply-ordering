"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  exact = false,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors ${active ? "bg-brand-tint font-semibold text-brand" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
    >
      {icon}
      {children}
    </Link>
  );
}
