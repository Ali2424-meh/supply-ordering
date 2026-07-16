import { signOutAction } from "@/actions/auth";
import { NavLink } from "@/components/NavLink";
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
    <div className="flex min-h-screen flex-col bg-zinc-50 md:flex-row">
      <aside className="border-b border-zinc-200 bg-white p-4 shadow-sm md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <p className="mb-3 text-xs font-semibold uppercase text-zinc-400">
          Supply
        </p>
        <nav aria-label="Admin" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:flex-col md:items-stretch">
          {enabled ? (
            <>
              <NavLink href="/admin/orders">Order requests</NavLink>
              <NavLink href="/admin/catalogue">Product catalogue</NavLink>
              <NavLink href="/admin/imports">Import history</NavLink>
            </>
          ) : (
            <p className="w-full text-zinc-400">Supply ordering is disabled.</p>
          )}
          {isAdmin && (
            <>
              <p className="mt-2 w-full text-xs font-semibold uppercase text-zinc-400 md:mt-4">
                Platform
              </p>
              <NavLink href="/admin/bookings">Bookings</NavLink>
              <NavLink href="/admin/customers">Customers</NavLink>
              <NavLink href="/admin/payouts">Payouts</NavLink>
              <NavLink href="/admin/settings">Settings</NavLink>
            </>
          )}
        </nav>
        <form action={signOutAction} className="mt-4 md:mt-8">
          <button className="min-h-10 text-sm text-zinc-500">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-3 pb-8 sm:p-5 md:p-7">{children}</main>
    </div>
  );
}
