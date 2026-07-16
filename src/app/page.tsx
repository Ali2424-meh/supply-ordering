import { redirect } from "next/navigation";
import { auth, homeFor } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    session.user.role === "CLEANER" ||
    session.user.role === "SUPPLY_MANAGER" ||
    session.user.role === "ADMIN"
  ) {
    redirect(homeFor(session.user.role));
  }
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="text-zinc-600">Nothing here for your role yet.</p>
    </main>
  );
}
