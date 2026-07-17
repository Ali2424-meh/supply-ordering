import { redirect } from "next/navigation";
import { RoleLanding } from "@/components/RoleLanding";
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
  const manager = user.role === "MANAGER";
  return (
    <RoleLanding
      name={user.name}
      email={user.email}
      roleLabel={manager ? "Manager account" : "Customer account"}
      description={
        manager
          ? "This account is set up for operations work. Supply ordering is available only to cleaners and supply staff."
          : "This account is set up for customer access. Supply ordering is available only to approved field workers."
      }
    />
  );
}
