import { redirect } from "next/navigation";
import { homeFor } from "@/lib/auth";
import { currentUser } from "@/lib/guards";

export default async function Home() {
  const user = await currentUser();
  if (!user || user.disabled) redirect("/login");
  if (
    user.role === "CLEANER" ||
    user.role === "SUPPLY_MANAGER" ||
    user.role === "ADMIN"
  ) {
    redirect(homeFor(user.role));
  }
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="text-zinc-600">Nothing here for your role yet.</p>
    </main>
  );
}
