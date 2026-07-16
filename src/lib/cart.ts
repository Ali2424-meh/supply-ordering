export type CartLine = { productId: string; quantity: number; priceCents: number };

export function lineTotalCents(line: CartLine): number {
  return line.priceCents * line.quantity;
}

export function cartTotalCents(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

export function clampQuantity(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(999, Math.max(1, Math.floor(q)));
}

export function hasDuplicateLines(lines: { productId: string }[]): boolean {
  return new Set(lines.map((l) => l.productId)).size !== lines.length;
}

export function findInvalidLines(
  lines: { productId: string }[],
  products: { id: string; active: boolean }[],
): string[] {
  const active = new Set(products.filter((p) => p.active).map((p) => p.id));
  return lines.map((l) => l.productId).filter((id) => !active.has(id));
}
