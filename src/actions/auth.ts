"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, homeFor, signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }

  const session = await auth();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  redirect(user ? homeFor(user.role) : "/login");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
