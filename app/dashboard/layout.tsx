import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabase } from "../lib/supabase-server";
import { getSession } from "../lib/auth-server";
import DashboardShell from "./components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, onboarding_done")
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) redirect("/login");

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isOnboarding = pathname === "/dashboard/onboarding";

  if (!restaurant.onboarding_done && !isOnboarding) {
    redirect("/dashboard/onboarding");
  }

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      restaurantSlug={restaurant.slug}
      userName={session.name}
      userRole={session.role}
    >
      {children}
    </DashboardShell>
  );
}
