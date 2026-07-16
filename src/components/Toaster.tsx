"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";

interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
}

interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 8000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    const timer = timerRefs.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timerRefs.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = `toast-${++idCounter.current}`;
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          actionLabel: options?.actionLabel,
          onAction: options?.onAction,
        },
      ]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timerRefs.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-0 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 pb-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto flex w-full items-center justify-between gap-3 rounded-lg bg-zinc-900 px-4 py-3 text-sm text-white shadow-lg"
            >
              <span className="flex-1">{t.message}</span>
              <div className="flex shrink-0 items-center gap-2">
                {t.actionLabel && t.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      t.onAction?.();
                      dismiss(t.id);
                    }}
                    className="rounded px-2 py-0.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    {t.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
