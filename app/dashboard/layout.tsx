import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase-server";
import { getSession } from "../lib/auth-server";
import DashboardShell from "./components/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch restaurant info
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("id", session.restaurantId)
    .single();

  if (!restaurant) redirect("/login");

  // Keep slug cookie in sync (used by public APIs)
  const cookieStore = await cookies();
  if (cookieStore.get("restaurant_slug")?.value !== restaurant.slug) {
    cookieStore.set("restaurant_slug", restaurant.slug, {
      path: "/", maxAge: 31536000, sameSite: "lax",
    });
  }

  return (
    <DashboardShell
      restaurantName={restaurant.name}
      restaurantSlug={restaurant.slug}
      userName={session.name}
      userRole={session.role}
    >
      {children}
    </DashboardShell>
  );
}
