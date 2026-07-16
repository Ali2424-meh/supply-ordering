import Link from "next/link";
import { notFound } from "next/navigation";
import { signOutAction } from "@/actions/auth";
import { CartBadge } from "@/components/CartBadge";
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
    <div className="mx-auto min-h-screen w-full max-w-3xl">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b p-3 sm:p-4">
        <nav className="flex items-center gap-3 text-sm font-medium sm:gap-4">
          <Link href="/supplies">Supplies</Link>
          <Link href="/supplies/catalogue">Catalogue</Link>
        </nav>
        <div className="flex items-center gap-2">
          <CartBadge count={cartCount} />
          <form action={signOutAction}>
            <button className="min-h-10 text-sm text-zinc-500">Sign out</button>
          </form>
        </div>
      </header>
      <main className="p-3 sm:p-4">{children}</main>
    </div>
  );
}
