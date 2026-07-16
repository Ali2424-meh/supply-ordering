import { notFound } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";

export default async function NewProductPage() {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">New product</h1>
      <ProductForm />
    </div>
  );
}
