import { notFound } from "next/navigation";
import { supabase } from "../lib/supabase-server";
import { getSession } from "../lib/auth-server";
import RestaurantPageClient from "./RestaurantPageClient";

type Props = {
  params: Promise<{ restaurantSlug: string }>;
  searchParams: Promise<{ table?: string; paid?: string; order_id?: string }>;
};

export default async function RestaurantPage({ params, searchParams }: Props) {
  const { restaurantSlug } = await params;
  const { table: tableParam, paid, order_id } = await searchParams;

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurantSlug)
    .single();

  if (error || !restaurant) {
    notFound();
  }

  // Restaurant suspendu : page 404 pour les visiteurs
  if ((restaurant as { status?: string }).status === "suspended") {
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
        image_url?: string | null;
      }) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        available: item.available,
        image_url: item.image_url ?? undefined,
      })),
  }));

  const { data: galleryData } = await supabase
    .from("restaurant_images")
    .select("id, url")
    .eq("restaurant_id", restaurant.id)
    .order("position");

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
    mapsUrl: restaurant.maps_url ?? "",
    onlinePaymentEnabled: (restaurant as { online_payment_enabled?: boolean }).online_payment_enabled ?? false,
    images: (galleryData ?? []).map((i: { id: string; url: string }) => ({ id: i.id, url: i.url })),
    menu,
  };

  // Vérifie si le visiteur est un gérant/propriétaire de CE restaurant
  const session = await getSession();
  const dashboardRole =
    session &&
    session.restaurantId === restaurant.id &&
    (session.role === "owner" || session.role === "manager")
      ? session.role
      : null;

  return (
    <RestaurantPageClient
      restaurant={restaurantData}
      tableParam={tableParam ?? ""}
      paidOrderId={paid === "1" ? (order_id ?? null) : null}
      dashboardRole={dashboardRole ?? undefined}
    />
  );
}
