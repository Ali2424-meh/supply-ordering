"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/products";
import {
  productInputSchema,
  type ProductInput,
} from "@/lib/product-schema";

type Props = { productId?: string; initial?: Partial<ProductInput> };

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
  const inputClass = "min-h-10 rounded border p-2";
  return (
    <form
      action={submit}
      data-testid="product-form"
      className="grid max-w-lg gap-3 text-sm"
    >
      <label className="grid gap-1">
        <span className="font-medium">Name *</span>
        <input
          name="name"
          defaultValue={value.name ?? ""}
          required
          maxLength={200}
          className={inputClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Variant</span>
          <input
            name="variantName"
            defaultValue={value.variantName ?? ""}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Category</span>
          <input
            name="category"
            defaultValue={value.category ?? ""}
            maxLength={120}
            className={inputClass}
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          defaultValue={value.description ?? ""}
          rows={3}
          maxLength={10_000}
          className="rounded border p-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="font-medium">Price (AUD) *</span>
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
            className={inputClass}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">SKU</span>
          <input
            name="sku"
            defaultValue={value.sku ?? ""}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Unit size</span>
          <input
            name="unitSize"
            defaultValue={value.unitSize ?? ""}
            maxLength={200}
            className={inputClass}
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="font-medium">Image URL</span>
        <input
          name="imageUrl"
          type="url"
          defaultValue={value.imageUrl ?? ""}
          maxLength={2_048}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Product page URL</span>
        <input
          name="productUrl"
          type="url"
          defaultValue={value.productUrl ?? ""}
          maxLength={2_048}
          className={inputClass}
        />
      </label>
      <label className="flex min-h-10 items-center gap-2">
        <input
          name="active"
          type="checkbox"
          defaultChecked={value.active ?? true}
        />
        Active
      </label>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-11 rounded bg-zinc-900 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
