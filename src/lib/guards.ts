import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { auth, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export type CurrentUser = Pick<
  User,
  "id" | "name" | "email" | "phone" | "role" | "disabled"
>;

async function loadCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      disabled: true,
    },
  });
}

/** Request-memoized DAL lookup for pages and layouts. */
export const currentUser = cache(loadCurrentUser);

export async function requireRole(...roles: Role[]) {
  const user = await currentUser();
  if (!user || user.disabled) redirect("/login");
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

/** For non-supply server actions: fresh authentication, role, and account state. */
export async function guardRoleAction(roles: Role[]): Promise<CurrentUser> {
  // Do not use the render-pass cache here: every mutation is a public endpoint
  // and must observe the latest role/disabled state from the database.
  const user = await loadCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (!roles.includes(user.role)) throw new Error("Not allowed.");
  if (user.disabled) throw new Error("Your account is disabled.");
  return user;
}

/** For supply server actions: also enforces the current feature toggle. */
export async function guardAction(roles: Role[]): Promise<CurrentUser> {
  const user = await guardRoleAction(roles);
  if (!(await supplyEnabled())) throw new Error("Supply ordering is currently disabled.");
  return user;
}
