import { cookies } from "next/headers";
import { supabase } from "../lib/supabase";
import DashboardShell from "./components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const slug = cookieStore.get("restaurant_slug")?.value ?? "le-bonus";

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  const restaurantName = restaurant?.name ?? "Mon Restaurant";
  const restaurantSlug = restaurant?.slug ?? slug;

  return (
    <DashboardShell
      restaurantName={restaurantName}
      restaurantSlug={restaurantSlug}
    >
      {children}
    </DashboardShell>
  );
}
