"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/products";
import {
  productInputSchema,
  type ProductInput,
} from "@/lib/product-schema";
import { btn, input, panel } from "@/lib/ui";

type Props = { productId?: string; initial?: Partial<ProductInput> };

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-3 px-5 py-4 sm:px-6">
      <legend className="float-left mb-1 w-full text-sm font-semibold text-zinc-900">
        {title}
        {hint && (
          <span className="block text-xs font-normal text-zinc-400">{hint}</span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

export function ProductForm({ productId, initial = {} }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(formData: FormData) {
    setError(null);
    const parsed = productInputSchema.safeParse({
      name: formData.get("name"),
      variantName: formData.get("variantName"),
      category: formData.get("category"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      priceCents: Math.round(Number(formData.get("price") || 0) * 100),
      sku: formData.get("sku"),
      unitSize: formData.get("unitSize"),
      productUrl: formData.get("productUrl"),
      active: formData.get("active") === "on",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    startTransition(async () => {
      try {
        if (productId) {
          await updateProduct(productId, parsed.data);
          router.push("/admin/catalogue");
        } else {
          const createdId = await createProduct(parsed.data);
          router.push(`/admin/catalogue/${createdId}/edit`);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed.");
      }
    });
  }

  const value = initial;
  const labelClass = "grid gap-1 text-sm font-medium text-zinc-700";
  return (
    <form
      action={submit}
      data-testid="product-form"
      className={`${panel()} max-w-2xl divide-y divide-zinc-100 overflow-hidden text-sm`}
    >
      <Section title="Basics">
        <label className={labelClass}>
          Name *
          <input
            name="name"
            defaultValue={value.name ?? ""}
            required
            maxLength={200}
            className={input()}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Variant
            <input
              name="variantName"
              defaultValue={value.variantName ?? ""}
              maxLength={200}
              className={input()}
            />
          </label>
          <label className={labelClass}>
            Category
            <input
              name="category"
              defaultValue={value.category ?? ""}
              maxLength={120}
              className={input()}
            />
          </label>
        </div>
        <label className={labelClass}>
          Description
          <textarea
            name="description"
            defaultValue={value.description ?? ""}
            rows={3}
            maxLength={10_000}
            className={`${input()} min-h-20 py-2`}
          />
        </label>
      </Section>

      <Section title="Pricing & identifiers">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Price (AUD) *
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              max="1000000"
              required
              defaultValue={
                value.priceCents != null
                  ? (value.priceCents / 100).toFixed(2)
                  : ""
              }
              className={input()}
            />
          </label>
          <label className={labelClass}>
            SKU
            <input
              name="sku"
              defaultValue={value.sku ?? ""}
              maxLength={200}
              className={input()}
            />
          </label>
          <label className={labelClass}>
            Unit size
            <input
              name="unitSize"
              defaultValue={value.unitSize ?? ""}
              maxLength={200}
              className={input()}
            />
          </label>
        </div>
      </Section>

      <Section title="Media & links" hint="HTTP(S) URLs only.">
        <label className={labelClass}>
          Image URL
          <input
            name="imageUrl"
            type="url"
            defaultValue={value.imageUrl ?? ""}
            maxLength={2_048}
            className={input()}
          />
        </label>
        <label className={labelClass}>
          Product page URL
          <input
            name="productUrl"
            type="url"
            defaultValue={value.productUrl ?? ""}
            maxLength={2_048}
            className={input()}
          />
        </label>
      </Section>

      <Section title="Visibility">
        <label className="flex min-h-10 items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2.5">
          <input
            name="active"
            type="checkbox"
            defaultChecked={value.active ?? true}
            className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
          />
          <span>
            <span className="block font-medium text-zinc-800">Active</span>
            <span className="block text-xs text-zinc-500">
              Active products appear in the worker catalogue and can be ordered.
            </span>
          </span>
        </label>
      </Section>

      <div className="flex items-center justify-between gap-3 bg-zinc-50/60 px-5 py-4 sm:px-6">
        <p role="alert" className="min-h-5 text-sm text-red-600">
          {error ?? ""}
        </p>
        <button disabled={pending} className={btn("primary", "md")}>
          {pending ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
