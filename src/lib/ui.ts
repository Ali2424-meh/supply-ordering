/**
 * Class recipes for the SupplyHub design system.
 *
 * Plain strings rather than components because call sites mix server
 * components, <Link>, <button>, and motion.button. Every class list is a
 * full literal so Tailwind's scanner sees it.
 */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-medium transition disabled:opacity-60";

const BTN_VARIANTS = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-hover",
  secondary:
    "border border-zinc-300 bg-white text-zinc-700 shadow-sm hover:border-zinc-400 hover:text-zinc-900",
  ghost: "text-brand hover:bg-brand-tint",
  danger: "bg-danger text-white shadow-sm hover:opacity-90",
} as const;

const BTN_SIZES = {
  sm: "min-h-9 rounded-lg px-3 text-sm",
  md: "min-h-10 rounded-lg px-3.5 text-sm",
  lg: "min-h-12 w-full rounded-xl px-4 font-semibold",
} as const;

export function btn(
  variant: keyof typeof BTN_VARIANTS = "primary",
  size: keyof typeof BTN_SIZES = "md",
) {
  return cx(BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size]);
}

const INPUT_BASE =
  "w-full border border-zinc-300 bg-white px-3 text-sm font-normal shadow-sm transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function input(size: "md" | "lg" = "md") {
  return cx(
    INPUT_BASE,
    size === "lg" ? "min-h-12 rounded-xl py-2.5" : "min-h-11 rounded-lg py-2",
  );
}

export function panel() {
  return "rounded-2xl border border-zinc-200 bg-white shadow-sm";
}
