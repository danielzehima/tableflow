import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurant_id = searchParams.get("restaurant_id");

  if (!restaurant_id) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const [ordersRes, reservationsRes, menuRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status, created_at")
      .eq("restaurant_id", restaurant_id),
    supabase
      .from("reservations")
      .select("id, guests, date")
      .eq("restaurant_id", restaurant_id),
    supabase
      .from("menu_items")
      .select("id, available, category_id, menu_categories!inner(restaurant_id)")
      .eq("menu_categories.restaurant_id", restaurant_id),
  ]);

  const orders = ordersRes.data ?? [];
  const reservations = reservationsRes.data ?? [];
  const menuItems = menuRes.data ?? [];

  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const revenue = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const todayReservations = reservations.filter((r) => r.date === today);
  const couverts = todayReservations.reduce((sum, r) => sum + (r.guests ?? 0), 0);

  return NextResponse.json([
    {
      label: "Chiffre d'affaires",
      value: `${revenue.toLocaleString("fr-FR")} F`,
      icon: "💰",
      change: "aujourd'hui",
      positive: true,
      sub: "Commandes payées",
    },
    {
      label: "Commandes",
      value: todayOrders.length,
      icon: "🛎️",
      change: "aujourd'hui",
      positive: true,
      sub: "Toutes tables confondues",
    },
    {
      label: "Réservations",
      value: reservations.filter((r) => r.date >= today).length,
      icon: "📅",
      change: "à venir",
      positive: true,
      sub: `${couverts} couverts aujourd'hui`,
    },
    {
      label: "Plats au menu",
      value: menuItems.length,
      icon: "📋",
      change: `${menuItems.filter((i) => i.available).length} dispo`,
      positive: true,
      sub: "Tous types confondus",
    },
  ]);
}
