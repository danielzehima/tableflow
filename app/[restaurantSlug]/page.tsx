import { notFound } from "next/navigation";
import { supabase } from "../lib/supabase";
import RestaurantPageClient from "./RestaurantPageClient";

type Props = {
  params: Promise<{ restaurantSlug: string }>;
};

export default async function RestaurantPage({ params }: Props) {
  const { restaurantSlug } = await params;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurantSlug)
    .single();

  if (error || !restaurant) {
    notFound();
  }

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
        id: string;
        name: string;
        description: string;
        price: number;
        available: boolean;
      }) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        available: item.available,
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
    menu,
  };

  return <RestaurantPageClient restaurant={restaurantData} />;
}
