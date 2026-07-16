"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { homeFor, signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }

  // The session cookie written by signIn is not readable through auth() until
  // the next request. Credentials have succeeded at this point, so resolve the
  // destination from the same normalized unique email instead.
  const user = await prisma.user.findUnique({ where: { email } });
  redirect(user ? homeFor(user.role) : "/login");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
