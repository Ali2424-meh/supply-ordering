import { z } from "zod";

export type CatalogueLine = {
  shopifyVariantId: string; name: string; variantName: string | null;
  category: string | null; description: string | null; imageUrl: string | null;
  priceCents: number; sku: string | null; productUrl: string;
};

export function parsePriceToCents(price: string): number {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price.trim());
  if (!m) throw new Error(`Malformed price: "${price}"`);
  const dollars = parseInt(m[1], 10);
  const cents = parseInt((m[2] ?? "0").padEnd(2, "0"), 10);
  return dollars * 100 + cents;
}

export const shopifyPageSchema = z.object({
  products: z.array(z.object({
    id: z.number(),
    title: z.string(),
    handle: z.string(),
    body_html: z.string().nullish(),
    product_type: z.string().nullish(),
    variants: z.array(z.object({
      id: z.number(),
      title: z.string(),
      price: z.string(),
      sku: z.string().nullish(),
    })),
    images: z.array(z.object({ src: z.string() })).nullish(),
  })),
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function mapProductsPage(page: unknown, baseUrl: string): CatalogueLine[] {
  const parsed = shopifyPageSchema.parse(page);
  return parsed.products.flatMap((p) =>
    p.variants.map((v) => ({
      shopifyVariantId: String(v.id),
      name: p.title,
      variantName: v.title === "Default Title" ? null : v.title,
      category: p.product_type || null,
      description: p.body_html ? stripHtml(p.body_html) || null : null,
      imageUrl: p.images?.[0]?.src ?? null,
      priceCents: parsePriceToCents(v.price),
      sku: v.sku || null,
      productUrl: `${baseUrl}/products/${p.handle}`,
    })),
  );
}

export async function fetchAllCatalogueLines(baseUrl: string): Promise<CatalogueLine[]> {
  const all: CatalogueLine[] = [];
  for (let pageNum = 1; pageNum <= 40; pageNum++) {
    const res = await fetch(`${baseUrl}/products.json?limit=250&page=${pageNum}`, {
      headers: { "user-agent": "SupplyOrdering/1.0" },
    });
    if (!res.ok) throw new Error(`Catalogue fetch failed: HTTP ${res.status}`);
    const lines = mapProductsPage(await res.json(), baseUrl);
    if (lines.length === 0) break;
    all.push(...lines);
  }
  return all;
}
