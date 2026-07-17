"use client";

import { useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { Brand } from "@/components/Brand";

export function AdminMobileMenu({
  enabled,
  isAdmin,
}: {
  enabled: boolean;
  isAdmin: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-brand/30 hover:text-brand"
        aria-label="Open admin navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        className="m-0 h-dvh w-[min(88vw,22rem)] max-w-none border-0 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/45"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <Brand variant="sidebar" />
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Close admin navigation"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
            <AdminNav enabled={enabled} isAdmin={isAdmin} />
          </nav>
        </div>
      </dialog>
    </>
  );
}
