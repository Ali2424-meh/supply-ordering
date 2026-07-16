"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { refreshCatalogue } from "@/actions/sync";

export function RefreshCatalogueButton() {
  const [message, setMessage] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <motion.button
        data-testid="refresh-catalogue"
        whileTap={{ scale: 0.97 }}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const result = await refreshCatalogue();
              setMessage({ text: result.message, ok: result.ok });
              router.refresh();
            } catch (caught) {
              setMessage({
                text:
                  caught instanceof Error
                    ? caught.message
                    : "Catalogue refresh failed.",
                ok: false,
              });
            }
          })
        }
        className="min-h-10 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh catalogue"}
      </motion.button>
      {message && (
        <p
          role="status"
          className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
