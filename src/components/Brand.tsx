import { Package } from "lucide-react";

type BrandVariant = "header" | "sidebar";

interface BrandProps {
  variant?: BrandVariant;
  /** Override size in px — if provided, overrides variant sizing */
  size?: number;
}

const variantConfig: Record<BrandVariant, { iconSize: number; textClass: string; squareClass: string }> = {
  header: {
    iconSize: 16,
    textClass: "text-base font-semibold",
    squareClass: "h-7 w-7",
  },
  sidebar: {
    iconSize: 20,
    textClass: "text-lg font-semibold",
    squareClass: "h-9 w-9",
  },
};

export function Brand({ variant = "header", size }: BrandProps) {
  const config = variantConfig[variant];
  const iconSize = size ?? config.iconSize;

  return (
    <span className="flex items-center gap-2 select-none">
      <span
        className={`${config.squareClass} flex items-center justify-center rounded-md bg-brand text-white`}
      >
        <Package size={iconSize} strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={`${config.textClass} text-brand`}>SupplyHub</span>
    </span>
  );
}
