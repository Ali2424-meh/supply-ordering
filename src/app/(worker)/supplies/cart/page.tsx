import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { EmptyState } from "@/components/EmptyState";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await requireRole("CLEANER");
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { id: "asc" },
  });
  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        hint="Browse the catalogue to add supplies."
      />
    );
  }
  return (
    <CartView
      lines={items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        variantName: item.product.variantName,
        imageUrl: item.product.imageUrl,
        priceCents: item.product.priceCents,
        quantity: item.quantity,
        active: item.product.active,
      }))}
    />
  );
}
