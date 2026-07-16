import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("SUPPLY_MANAGER", "ADMIN");
  const enabled = await supplyEnabled();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b p-4 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <p className="mb-3 text-xs font-semibold uppercase text-zinc-400">
          Supply
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:flex-col md:items-stretch">
          {enabled ? (
            <>
              <Link href="/admin/orders">Order requests</Link>
              <Link href="/admin/catalogue">Product catalogue</Link>
              <Link href="/admin/imports">Import history</Link>
            </>
          ) : (
            <p className="w-full text-zinc-400">Supply ordering is disabled.</p>
          )}
          {isAdmin && (
            <>
              <p className="mt-2 w-full text-xs font-semibold uppercase text-zinc-400 md:mt-4">
                Platform
              </p>
              <Link href="/admin/bookings">Bookings</Link>
              <Link href="/admin/customers">Customers</Link>
              <Link href="/admin/payouts">Payouts</Link>
              <Link href="/admin/settings">Settings</Link>
            </>
          )}
        </nav>
        <form action={signOutAction} className="mt-4 md:mt-8">
          <button className="min-h-10 text-sm text-zinc-500">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">{children}</main>
    </div>
  );
}
