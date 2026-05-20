import { cookies } from "next/headers";
import { supabase } from "../lib/supabase";

const orderStatusStyle: Record<string, string> = {
  "En cours": "bg-blue-50 text-blue-600",
  Servi: "bg-amber-50 text-amber-600",
  Payé: "bg-green-50 text-green-700",
};

const reservationStatusStyle: Record<string, string> = {
  Confirmée: "bg-green-50 text-green-700",
  "En attente": "bg-amber-50 text-amber-600",
};

async function getDashboardData(restaurantId: string) {
  const today = new Date().toISOString().split("T")[0];

  const [ordersRes, reservationsRes, menuRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("date", today)
      .order("date")
      .order("time")
      .limit(6),
    supabase
      .from("menu_items")
      .select("id, available, menu_categories!inner(restaurant_id)")
      .eq("menu_categories.restaurant_id", restaurantId),
  ]);

  const orders = ordersRes.data ?? [];
  const reservations = reservationsRes.data ?? [];
  const menuItems = menuRes.data ?? [];

  const todayOrders = orders.filter((o) =>
    o.created_at?.startsWith(today)
  );
  const revenue = todayOrders
    .filter((o) => o.status === "Payé")
    .reduce((sum: number, o: { total: number }) => sum + o.total, 0);

  const stats = [
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
      label: "Réservations à venir",
      value: reservations.length,
      icon: "📅",
      change: "prochaines",
      positive: true,
      sub: "À partir d'aujourd'hui",
    },
    {
      label: "Plats au menu",
      value: menuItems.length,
      icon: "📋",
      change: `${menuItems.filter((i: { available: boolean }) => i.available).length} dispo`,
      positive: true,
      sub: "Tous types confondus",
    },
  ];

  return { stats, orders, reservations };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("restaurant_slug")?.value ?? "le-bonus";

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  const restaurantId = restaurant?.id ?? "";
  const { stats, orders, reservations } = restaurantId
    ? await getDashboardData(restaurantId)
    : { stats: [], orders: [], reservations: [] };

  const emptyStats = [
    { label: "Chiffre d'affaires", value: "0 F", icon: "💰", change: "aujourd'hui", positive: true, sub: "Commandes payées" },
    { label: "Commandes", value: 0, icon: "🛎️", change: "aujourd'hui", positive: true, sub: "Toutes tables confondues" },
    { label: "Réservations à venir", value: 0, icon: "📅", change: "prochaines", positive: true, sub: "À partir d'aujourd'hui" },
    { label: "Plats au menu", value: 0, icon: "📋", change: "0 dispo", positive: true, sub: "Tous types confondus" },
  ];

  const displayStats = stats.length > 0 ? stats : emptyStats;

  return (
    <div className="space-y-8">
      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  stat.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}
              >
                {stat.positive ? "↑" : "↓"} {stat.change}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 leading-tight">
              {stat.value}
            </div>
            <div className="text-xs text-green-700 mt-1">
              {stat.label} <span className="text-green-700">· {stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Commandes & Réservations ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Commandes récentes */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Commandes récentes</h2>
            <span className="text-xs text-green-700">{orders.length} commande{orders.length > 1 ? "s" : ""}</span>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-green-700 text-sm">
              Aucune commande pour l'instant
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-green-700 uppercase tracking-wider border-b border-slate-50">
                    <th className="px-6 py-3 font-medium">Table</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Articles</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {order.table_number}
                      </td>
                      <td className="px-6 py-4 text-green-700 max-w-[200px] truncate hidden sm:table-cell">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {order.total.toLocaleString("fr-FR")} F
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            orderStatusStyle[order.status] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-green-700 text-xs whitespace-nowrap hidden md:table-cell">
                        {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Réservations à venir */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-slate-900">Réservations à venir</h2>
            <span className="text-xs text-green-700">{reservations.length}</span>
          </div>

          {reservations.length === 0 ? (
            <div className="px-6 py-12 text-center text-green-700 text-sm">
              Aucune réservation à venir
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">
                        {r.customer_name}
                      </div>
                      <div className="text-xs text-green-700 mt-0.5">
                        {r.guests} pers. · {new Date(r.date).toLocaleDateString("fr-FR")} {r.time}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        reservationStatusStyle[r.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-4">Actions rapides</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: "➕", label: "Ajouter un plat", href: "/dashboard/menu" },
            { icon: "📋", label: "Modifier le menu", href: "/dashboard/menu" },
            { icon: "📊", label: "Voir les analytics", href: "/dashboard/analytics" },
            { icon: "🌐", label: "Voir ma page publique", href: `/${restaurant?.slug ?? "le-bonus"}` },
            { icon: "⚙️", label: "Paramètres", href: "/dashboard/parametres" },
          ].map(({ icon, label, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors"
            >
              <span>{icon}</span> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
