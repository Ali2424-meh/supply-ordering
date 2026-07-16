import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { auth, homeFor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supplyEnabled } from "@/lib/settings";

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect(homeFor(session.user.role));
  return session.user;
}

/** For server actions: throws instead of redirecting; re-checks the DB. */
export async function guardAction(roles: Role[]): Promise<User> {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in.");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Not signed in.");
  if (!roles.includes(user.role)) throw new Error("Not allowed.");
  if (user.disabled) throw new Error("Your account is disabled.");
  if (!(await supplyEnabled())) throw new Error("Supply ordering is currently disabled.");
  return user;
}
