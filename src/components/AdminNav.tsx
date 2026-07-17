"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  Package,
  Upload,
  BookOpen,
  Users,
  DollarSign,
  Settings,
  UserRound,
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  mobile?: boolean;
}

function AdminNavItem({ href, icon, label, mobile }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
          active
            ? "border-brand text-white"
            : "border-transparent text-zinc-400 hover:text-zinc-100"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

interface AdminNavProps {
  enabled: boolean;
  isAdmin: boolean;
  mobile?: boolean;
}

export function AdminNav({ enabled, isAdmin, mobile }: AdminNavProps) {
  const wrapClass = mobile
    ? "flex flex-row"
    : "flex flex-col gap-0.5";

  const sectionLabelClass = mobile
    ? "hidden"
    : "mt-4 mb-1 px-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500";

  return (
    <div className={wrapClass}>
      {enabled ? (
        <>
          {!mobile && (
            <p className="mb-1 px-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Supply
            </p>
          )}
          <AdminNavItem
            href="/admin/orders"
            icon={<ClipboardList size={16} aria-hidden="true" />}
            label="Order requests"
            mobile={mobile}
          />
          <AdminNavItem
            href="/admin/catalogue"
            icon={<Package size={16} aria-hidden="true" />}
            label="Product catalogue"
            mobile={mobile}
          />
          <AdminNavItem
            href="/admin/imports"
            icon={<Upload size={16} aria-hidden="true" />}
            label="Import history"
            mobile={mobile}
          />
        </>
      ) : (
        !mobile && (
          <p className="px-2.5 text-sm text-zinc-500">
            Supply ordering is disabled.
          </p>
        )
      )}
      <AdminNavItem
        href="/admin/account"
        icon={<UserRound size={16} aria-hidden="true" />}
        label="My account"
        mobile={mobile}
      />
      {isAdmin && (
        <>
          {!mobile && (
            <p className={sectionLabelClass}>Platform</p>
          )}
          <AdminNavItem
            href="/admin/bookings"
            icon={<BookOpen size={16} aria-hidden="true" />}
            label="Bookings"
            mobile={mobile}
          />
          <AdminNavItem
            href="/admin/customers"
            icon={<Users size={16} aria-hidden="true" />}
            label="Customers"
            mobile={mobile}
          />
          <AdminNavItem
            href="/admin/payouts"
            icon={<DollarSign size={16} aria-hidden="true" />}
            label="Payouts"
            mobile={mobile}
          />
          <AdminNavItem
            href="/admin/settings"
            icon={<Settings size={16} aria-hidden="true" />}
            label="Settings"
            mobile={mobile}
          />
        </>
      )}
    </div>
  );
}
