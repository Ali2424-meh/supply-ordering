const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

export function formatAud(cents: number): string {
  return aud.format(cents / 100);
}

export function formatOrderNumber(n: number): string {
  return `OR-${String(n).padStart(5, "0")}`;
}
