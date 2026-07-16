import { z } from "zod";

export type CatalogueLine = {
  shopifyVariantId: string; name: string; variantName: string | null;
  category: string | null; description: string | null; imageUrl: string | null;
  priceCents: number; sku: string | null; unitSize: string | null;
  productUrl: string;
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
    options: z.array(z.object({
      name: z.string(),
      position: z.number().int().min(1).max(3),
    })).optional(),
    variants: z.array(z.object({
      id: z.number(),
      title: z.string(),
      price: z.string(),
      sku: z.string().nullish(),
      option1: z.string().nullish().optional(),
      option2: z.string().nullish().optional(),
      option3: z.string().nullish().optional(),
    })),
    images: z.array(z.object({ src: z.string() })).nullish(),
  })),
});

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return text.replace(
    /&(#(?:x[0-9a-f]+|\d+)|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, code: string) => {
      if (!code.startsWith("#")) return named[code.toLowerCase()] ?? entity;
      const hex = code[1]?.toLowerCase() === "x";
      const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) && value >= 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : entity;
    },
  );
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function unitSizeFor(
  options: Array<{ name: string; position: number }>,
  variant: { option1?: string | null; option2?: string | null; option3?: string | null },
): string | null {
  const option = options.find(({ name }) =>
    /size|volume|weight|pack|quantity|qty|capacity/i.test(name),
  );
  if (!option) return null;
  const value = [variant.option1, variant.option2, variant.option3][
    option.position - 1
  ];
  return value && value !== "Default Title" ? value : null;
}

export function mapProductsPage(page: unknown, baseUrl: string): CatalogueLine[] {
  const parsed = shopifyPageSchema.parse(page);
  const origin = baseUrl.replace(/\/+$/, "");
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
      unitSize: unitSizeFor(p.options ?? [], v),
      productUrl: `${origin}/products/${p.handle}`,
    })),
  );
}

const PAGE_SIZE = 50;
const MAX_PAGES = 200;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

async function fetchCataloguePage(url: string, pageNum: number) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "user-agent": "SupplyOrdering/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 250 * 2 ** attempt),
      );
      continue;
    }
    if (response.ok) return response;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === 3) {
      throw new Error(
        `Catalogue fetch failed for page ${pageNum}: HTTP ${response.status}`,
      );
    }
    await response.body?.cancel();
    await new Promise((resolve) =>
      setTimeout(resolve, 250 * 2 ** attempt),
    );
  }
  throw new Error(`Catalogue fetch failed for page ${pageNum}.`);
}

export async function fetchAllCatalogueLines(baseUrl: string): Promise<CatalogueLine[]> {
  const all: CatalogueLine[] = [];
  let reachedEnd = false;
  // Shopify permits larger responses, but complex catalogue pages can
  // intermittently return 503. Smaller pages plus bounded retries are more
  // reliable while retaining the original 10,000-product ceiling.
  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const url = `${baseUrl}/products.json?limit=${PAGE_SIZE}&page=${pageNum}`;
    const res = await fetchCataloguePage(url, pageNum);
    const lines = mapProductsPage(await res.json(), baseUrl);
    if (lines.length === 0) {
      reachedEnd = true;
      break;
    }
    all.push(...lines);
  }
  if (!reachedEnd) {
    throw new Error(
      `Catalogue exceeds the supported ${PAGE_SIZE * MAX_PAGES} products.`,
    );
  }
  return all;
}
