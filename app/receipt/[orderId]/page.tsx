import { notFound } from "next/navigation";
import { supabase } from "../../lib/supabase-server";
import { PrintButton, BackButton } from "./ReceiptClient";
import { formatMoney } from "../../lib/currency";

function parseItems(items: string): { quantity: number; name: string }[] {
  return items.split(",").map((s) => s.trim()).flatMap((part) => {
    const m = part.match(/^(\d+)x\s+(.+)$/);
    return m ? [{ quantity: parseInt(m[1], 10), name: m[2].trim() }] : [];
  });
}

function fmt(d: string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const { data: order } = await supabase
    .from("orders")
    .select("id, table_number, items, total, status, customer_name, created_at, restaurant_id, restaurants(name, address, phone, currency)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  // Numéro de reçu : RECU_DDMMYYYY_N (position de la commande dans la journée)
  const orderDate = new Date(order.created_at as string);
  const dayStart = new Date(orderDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(orderDate);
  dayEnd.setHours(23, 59, 59, 999);

  const { count: receiptIndex } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", order.restaurant_id)
    .gte("created_at", dayStart.toISOString())
    .lte("created_at", order.created_at as string);

  const dd = String(orderDate.getDate()).padStart(2, "0");
  const mm = String(orderDate.getMonth() + 1).padStart(2, "0");
  const yyyy = orderDate.getFullYear();
  const receiptNumber = `RECU_${dd}${mm}${yyyy}_${receiptIndex ?? 1}`;

  const { data: payment } = await supabase
    .from("payments")
    .select("reference, amount, currency, method, status, created_at")
    .eq("order_id", orderId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
  const currency = (restaurant as { currency?: string })?.currency ?? "XOF";
  const items = parseItems(order.items as string);
  const isPaid = order.status === "paid" || !!payment;

  // Récupère les prix du menu via les catégories du restaurant
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("name, price, menu_categories!inner(restaurant_id)")
    .eq("menu_categories.restaurant_id", order.restaurant_id);

  const priceMap = new Map<string, number>();
  (menuItems ?? []).forEach((mi: { name: string; price: number }) =>
    priceMap.set(mi.name.toLowerCase().trim(), mi.price)
  );

  const itemsWithPrices = items.map((item) => {
    const unitPrice = priceMap.get(item.name.toLowerCase().trim()) ?? null;
    return {
      ...item,
      unitPrice,
      lineTotal: unitPrice != null ? unitPrice * item.quantity : null,
    };
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-card { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4">

        {/* Boutons */}
        <div className="no-print w-full max-w-sm mb-4 flex gap-2">
          <PrintButton receiptNumber={receiptNumber} />
          <BackButton />
        </div>

        {/* Carte reçu */}
        <div className="receipt-card bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-slate-900 px-6 py-6 text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <h1 className="text-white font-extrabold text-xl">{(restaurant as { name: string })?.name ?? ""}</h1>
            {(restaurant as { address?: string })?.address && (
              <p className="text-slate-400 text-xs mt-1">{(restaurant as { address: string }).address}</p>
            )}
            {(restaurant as { phone?: string })?.phone && (
              <p className="text-slate-400 text-xs">{(restaurant as { phone: string }).phone}</p>
            )}
          </div>

          {/* Statut paiement */}
          <div className={`px-6 py-3 text-center text-sm font-bold ${isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {isPaid ? "✓ PAIEMENT CONFIRMÉ" : "⏳ EN ATTENTE DE PAIEMENT"}
          </div>

          {/* Infos commande */}
          <div className="px-6 py-5 border-b border-dashed border-slate-200 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">N° Reçu</span>
              <span className="font-mono text-slate-700 text-xs font-bold">{receiptNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Table</span>
              <span className="font-semibold text-slate-800">{order.table_number}</span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Client</span>
                <span className="font-semibold text-slate-800">{order.customer_name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-800 text-xs">{fmt(order.created_at as string)}</span>
            </div>
          </div>

          {/* Articles */}
          <div className="px-6 py-5 border-b border-dashed border-slate-200 space-y-2">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Articles</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Montant</p>
            </div>
            {itemsWithPrices.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-slate-700">
                    {item.quantity}x {item.name}
                  </span>
                  {item.unitPrice != null && (
                    <span className="text-slate-400 text-xs ml-1.5">
                      ({item.unitPrice.toLocaleString("fr-FR")} × {item.quantity})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">
                  {item.lineTotal != null
                    ? formatMoney(item.lineTotal, currency)
                    : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-6 py-5 border-b border-dashed border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-slate-900 text-base">TOTAL</span>
              <span className="font-extrabold text-orange-600 text-xl">
                {formatMoney(Number(order.total), currency)}
              </span>
            </div>
          </div>

          {/* Paiement */}
          {payment && (
            <div className="px-6 py-5 border-b border-dashed border-slate-200 space-y-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Paiement</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Méthode</span>
                <span className="font-semibold text-slate-700 capitalize">{payment.method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Référence</span>
                <span className="font-mono text-slate-700 text-xs">{payment.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payé le</span>
                <span className="font-semibold text-slate-700 text-xs">{fmt(payment.created_at as string)}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-5 text-center">
            <p className="text-slate-400 text-xs">Merci pour votre commande !</p>
            <p className="text-slate-300 text-[10px] mt-2">Propulsé par TableFlow</p>
          </div>
        </div>
      </div>
    </>
  );
}
