import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { AdminNav } from "@/components/AdminNav";
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
    <div className="flex min-h-screen flex-col bg-zinc-100 md:flex-row">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-zinc-700 bg-zinc-900 px-4 py-3 md:hidden">
        <Brand variant="sidebar" onDark />
        <form action={signOutAction}>
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
            <LogOut size={15} aria-hidden="true" />
            <span className="sr-only">Sign out</span>
          </button>
        </form>
      </header>

      {/* Mobile horizontal nav */}
      <nav
        aria-label="Admin"
        className="overflow-x-auto border-b border-zinc-700 bg-zinc-900 md:hidden"
      >
        <AdminNav
          enabled={enabled}
          isAdmin={isAdmin}
          mobile
        />
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <Brand variant="sidebar" onDark />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <AdminNav enabled={enabled} isAdmin={isAdmin} />
        </div>
        <div className="border-t border-zinc-800 px-3 py-4">
          <form action={signOutAction}>
            <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-3 pb-8 sm:p-5 md:p-7">{children}</main>
    </div>
  );
}
