import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { AdminNav } from "@/components/AdminNav";
import { AdminMobileMenu } from "@/components/AdminMobileMenu";
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
    <div
      className="flex min-h-screen flex-col sm:flex-row"
      style={{ background: "var(--color-paper)" }}
    >
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:hidden">
        <Brand variant="sidebar" />
        <div className="flex items-center gap-1">
          <form action={signOutAction}>
            <button className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800">
              <LogOut size={17} aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
          <AdminMobileMenu enabled={enabled} isAdmin={isAdmin} />
        </div>
      </header>

      {/* Tablet icon rail / desktop sidebar */}
      <aside className="hidden sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-[4.5rem] sm:shrink-0 sm:flex-col sm:border-r sm:border-zinc-200 sm:bg-white xl:w-64">
        <div className="flex min-h-[4.25rem] items-center justify-center border-b border-zinc-100 px-3 xl:justify-start xl:px-5">
          <span className="xl:hidden"><Brand variant="sidebar" compact /></span>
          <span className="hidden xl:inline"><Brand variant="sidebar" /></span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-2 py-4 xl:px-3">
          <div className="xl:hidden">
            <AdminNav enabled={enabled} isAdmin={isAdmin} compact />
          </div>
          <div className="hidden xl:block">
            <AdminNav enabled={enabled} isAdmin={isAdmin} />
          </div>
        </div>
        <div className="border-t border-zinc-100 px-2 py-3 xl:px-3 xl:py-4">
          <div className="mb-2 hidden px-2.5 xl:block">
            <p className="truncate text-sm font-medium text-zinc-800">
              {user.name}
            </p>
            <p className="text-xs text-zinc-400">
              {isAdmin ? "Administrator" : "Supply manager"}
            </p>
          </div>
          <form action={signOutAction}>
            <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 xl:justify-start">
              <LogOut size={16} aria-hidden="true" />
              <span className="sr-only xl:not-sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-3 pb-8 sm:p-5 lg:p-7">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
