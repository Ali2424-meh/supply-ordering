import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullish()
  .transform((value) => value ?? null);

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  variantName: optionalText,
  category: optionalText,
  description: optionalText,
  imageUrl: optionalText,
  priceCents: z.number().int().min(0),
  sku: optionalText,
  unitSize: optionalText,
  productUrl: optionalText,
  active: z.boolean(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
