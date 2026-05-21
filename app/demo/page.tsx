import { notFound } from "next/navigation";
import { supabase } from "../lib/supabase-server";
import RestaurantPageClient from "../[restaurantSlug]/RestaurantPageClient";

export default async function DemoPage() {
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_demo", true)
    .single();

  if (!restaurant) notFound();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  const menu = (categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: (cat.menu_items ?? [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map((item: {
        id: string; name: string; description: string; price: number;
        available: boolean; image_url?: string | null;
      }) => ({
        id: item.id, name: item.name, description: item.description,
        price: item.price, available: item.available, image_url: item.image_url ?? undefined,
      })),
  }));

  const restaurantData = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description ?? "",
    tagline: restaurant.tagline ?? "",
    address: restaurant.address ?? "",
    phone: restaurant.phone ?? "",
    email: restaurant.email ?? "",
    hours: restaurant.hours ?? "",
    cuisine: restaurant.cuisine ?? "",
    coverImage: restaurant.cover_image || "/hero-restaurant.png",
    primaryColor: restaurant.primary_color || "#f97316",
    welcomeMessage: restaurant.welcome_message || "",
    isDemo: true,
    menu,
  };

  return <RestaurantPageClient restaurant={restaurantData} tableParam="5" />;
}
