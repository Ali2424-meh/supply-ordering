import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullish()
    .transform((value) => value ?? null);

const optionalHttpUrl = optionalText(2_048).refine((value) => {
  if (value === null) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Enter a valid http or https URL");

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  variantName: optionalText(200),
  category: optionalText(120),
  description: optionalText(10_000),
  imageUrl: optionalHttpUrl,
  priceCents: z.number().int().min(0).max(100_000_000),
  sku: optionalText(200),
  unitSize: optionalText(200),
  productUrl: optionalHttpUrl,
  active: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
