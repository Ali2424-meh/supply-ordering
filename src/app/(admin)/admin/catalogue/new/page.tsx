import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";
import { requireRole } from "@/lib/guards";
import { supplyEnabled } from "@/lib/settings";

export default async function NewProductPage() {
  await requireRole("SUPPLY_MANAGER", "ADMIN");
  if (!(await supplyEnabled())) notFound();
  return (
    <div>
      <PageHeader
        eyebrow="Supply"
        title="New product"
        description="Manually added products live alongside items synced from the store."
      />
      <ProductForm />
    </div>
  );
}
