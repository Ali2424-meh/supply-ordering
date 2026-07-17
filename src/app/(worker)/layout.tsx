import { notFound } from "next/navigation";
import { Home, ShoppingBag, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { CartBadge } from "@/components/CartBadge";
import { NavLink } from "@/components/NavLink";
import { WorkerScrollProgress } from "@/components/WorkerScrollProgress";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("CLEANER");
  if (!(await supplyEnabled())) notFound();
  const cartCount = await prisma.cartItem.count({ where: { userId: user.id } });

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl" style={{ background: "var(--color-paper)" }}>
      <WorkerScrollProgress />
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:rounded-b-2xl sm:p-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Brand variant="header" />
          <nav aria-label="Worker" className="flex items-center gap-1 text-sm font-medium">
            <NavLink href="/supplies" exact icon={<Home size={15} aria-hidden="true" />}>Supplies</NavLink>
            <NavLink href="/supplies/catalogue" icon={<ShoppingBag size={15} aria-hidden="true" />}>Catalogue</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <CartBadge count={cartCount} />
          <form action={signOutAction}>
            <button className="flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
              <LogOut size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>
      <main className="p-3 pb-10 sm:p-5 sm:pb-12 lg:p-7 lg:pb-14">{children}</main>
    </div>
  );
}
