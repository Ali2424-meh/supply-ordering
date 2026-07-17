"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guardRoleAction } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const accountSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  phone: z
    .string()
    .trim()
    .max(40, "Phone must be 40 characters or fewer.")
    .transform((value) => value || null),
});

export type AccountState = { ok?: boolean; error?: string };

export async function updateAccount(
  _previous: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const user = await guardRoleAction(["SUPPLY_MANAGER", "ADMIN"]);
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}
