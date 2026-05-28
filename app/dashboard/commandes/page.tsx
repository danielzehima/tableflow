"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "../../lib/supabase-client";

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";

type Order = {
  id: string;
  table_number: string;
  items: string;
  total: number | string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  payments?: { method: string; status: string }[];
};

type Table = { id: string; name: string };
type MenuItem = { id: string; name: string; price: number; category: string };
type CartItem  = { item: MenuItem; qty: number };

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: "En attente",     color: "bg-orange-500/15 text-orange-400 border border-orange-500/30",   dot: "bg-orange-400" },
  preparing: { label: "En préparation", color: "bg-blue-500/15 text-blue-400 border border-blue-500/30",          dot: "bg-blue-400" },
  ready:     { label: "Prêt",           color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400" },
  served:    { label: "Servi",          color: "bg-slate-500/15 text-green-700 border border-slate-600",          dot: "bg-slate-400" },
  paid:      { label: "Payé",           color: "bg-gray-500/15 text-gray-400 border border-gray-600",             dot: "bg-gray-400" },
  cancelled: { label: "Annulé",         color: "bg-red-500/15 text-red-400 border border-red-500/30",             dot: "bg-red-400" },
};

const NEXT_STATUS: Record<string, { status: OrderStatus; label: string }> = {
  pending:   { status: "preparing", label: "Démarrer" },
  preparing: { status: "ready",     label: "Marquer prêt" },
  ready:     { status: "served",    label: "Servir" },
  served:    { status: "paid",      label: "Encaisser" },
};

const STATUS_FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",      label: "Toutes" },
  { key: "pending",  label: "En attente" },
  { key: "preparing",label: "En préparation" },
  { key: "ready",    label: "Prêt" },
  { key: "served",   label: "Servi" },
  { key: "paid",     label: "Payé" },
];

const ACTIVE_STATUS_FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all",      label: "Toutes" },
  { key: "pending",  label: "En attente" },
  { key: "preparing",label: "En préparation" },
  { key: "ready",    label: "Prêt" },
  { key: "served",   label: "Servi" },
];

const PERIOD_FILTERS: { key: string; label: string }[] = [
  { key: "all",   label: "Tout" },
  { key: "today", label: "Aujourd'hui" },
  { key: "7",     label: "7 jours" },
  { key: "30",    label: "30 jours" },
];

const EMPTY_ORDER = { table_number: "", notes: "" };

function elapsed(created_at: string) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 60000);
  if (diff < 1) return "< 1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, "0")}`;
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [period, setPeriod] = useState("all");
  const [connected, setConnected] = useState(false);
  const [, setTick] = useState(0);
  const [channelKey, setChannelKey] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"active" | "historique">("active");
  const [historySearch, setHistorySearch] = useState("");

  // ── Encaissement espèces ──────────────────────────────────────────────────
  // Modal 1 : saisie de la somme reçue
  const [cashOrder, setCashOrder] = useState<Order | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [cashSaving, setCashSaving] = useState(false);
  // Modal 2 : choix d'impression (données conservées pour les fonctions d'impression)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastCashData, setLastCashData] = useState<{
    order: Order;
    received: number;
    change: number;
  } | null>(null);
  // ─────────────────────────────────────────────────────────────────────────

  // Nouvelle commande
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ ...EMPTY_ORDER });
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [customTable, setCustomTable] = useState(false);

  const normalize = (o: Order): Order => {
    const map: Record<string, OrderStatus> = {
      "En cours":  "pending",
      "Servi":     "served",
      "Payé":      "paid",
      "Annulé":    "cancelled",
    };
    return map[o.status as string] ? { ...o, status: map[o.status as string] } : o;
  };

  const loadOrders = useCallback(async (rid: string, p?: string) => {
    const params = new URLSearchParams({ restaurant_id: rid, limit: "200" });
    const activePeriod = p ?? "all";
    if (activePeriod !== "all") params.set("period", activePeriod);
    const r = await fetch(`/api/orders?${params}`);
    if (r.ok) {
      const data: Order[] = await r.json();
      setOrders(data.map(normalize));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/auth/restaurant");
      if (!res.ok) { setLoading(false); return; }
      const restaurant = await res.json();
      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.name ?? "Restaurant");
      await loadOrders(restaurant.id, "all");

      const tr = await fetch(`/api/tables?restaurant_id=${restaurant.id}`);
      if (tr.ok) setTables(await tr.json());

      setLoading(false);
    }
    init();
  }, [loadOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    loadOrders(restaurantId, period);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabaseClient
      .channel(`orders-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [normalize(payload.new as Order), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) => prev.map((o) => o.id === (payload.new as Order).id ? normalize(payload.new as Order) : o));
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => { supabaseClient.removeChannel(channel); };
  // channelKey changes when app returns from background → forces reconnect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, channelKey]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Reconnect Supabase Realtime when app returns from background (mobile sleep)
  useEffect(() => {
    if (!restaurantId) return;
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadOrders(restaurantId!, period);
        setChannelKey((k) => k + 1);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [restaurantId, period, loadOrders]);

  async function advance(id: string, nextStatus: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok && restaurantId) await loadOrders(restaurantId);
    } finally {
      setUpdating(null);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Annuler cette commande ?")) return;
    setUpdating(id);
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (restaurantId) await loadOrders(restaurantId);
    } finally {
      setUpdating(null);
    }
  }

  // ── Valide l'encaissement espèces ────────────────────────────────────────
  async function confirmCashPayment() {
    if (!cashOrder) return;
    const received = parseFloat(amountReceived) || 0;
    const total = Number(cashOrder.total);
    if (received < total) return; // sécurité (le bouton est disabled, mais au cas où)

    setCashSaving(true);

    // TODO: appel API — mettre la commande en statut "paid" dans Supabase
    const res = await fetch(`/api/orders/${cashOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });

    if (res.ok) {
      // Conserver les données pour les fonctions d'impression
      setLastCashData({ order: cashOrder, received, change: received - total });

      // Fermer Modal 1, ouvrir Modal 2, recharger la liste
      setCashOrder(null);
      setAmountReceived("");
      setShowPrintModal(true);
      if (restaurantId) await loadOrders(restaurantId);
    }

    setCashSaving(false);
  }
  // ─────────────────────────────────────────────────────────────────────────

  function addToCart(item: MenuItem) {
    setCartItems(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCartItems(prev => prev
      .map(c => c.item.id === itemId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;
    if (cartItems.length === 0) { setOrderError("Ajoutez au moins un article"); return; }
    setOrderSaving(true);
    setOrderError("");

    const itemsStr = cartItems.map(c => `${c.qty}x ${c.item.name}`).join(", ");
    const total = cartItems.reduce((s, c) => s + c.item.price * c.qty, 0);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        table_number: orderForm.table_number,
        items: itemsStr,
        notes: orderForm.notes || undefined,
        total,
      }),
    });

    if (res.ok) {
      setShowNewOrder(false);
      setOrderForm({ ...EMPTY_ORDER });
      setCartItems([]);
      await loadOrders(restaurantId);
    } else {
      const d = await res.json();
      setOrderError(d.error ?? "Erreur lors de la création");
    }
    setOrderSaving(false);
  }

  function buildExportRows() {
    return filtered.map((o) => [
      new Date(o.created_at).toLocaleString("fr-FR"),
      o.table_number,
      o.items,
      Number(o.total),
      STATUS_CONFIG[o.status]?.label ?? o.status,
    ]);
  }

  const exportHeaders = ["Date/Heure", "Table", "Articles", "Total (FCFA)", "Statut"];
  const exportSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const exportDate = new Date().toLocaleDateString("fr-CA");

  async function exportExcel() {
    setShowExportMenu(false);
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...buildExportRows()]);
    ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 40 }, { wch: 14 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
    XLSX.writeFile(wb, `commandes-${exportSlug}-${exportDate}.xlsx`);
  }

  async function exportPDF() {
    setShowExportMenu(false);
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(249, 115, 22);
    doc.text("TableFlow", 14, 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(restaurantName, 14, 27);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const periodLabel = PERIOD_FILTERS.find((p) => p.key === period)?.label ?? "Tout";
    doc.text(`Export commandes — ${periodLabel} — ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [exportHeaders],
      body: buildExportRows(),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: { 2: { cellWidth: 80 } },
    });

    doc.save(`commandes-${exportSlug}-${exportDate}.pdf`);
  }

  const today = new Date().toLocaleDateString("fr-CA");
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const activeOrders = orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
  const revenue = todayOrders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.total), 0);

  const activeTabOrders = orders.filter((o) => ["pending", "preparing", "ready", "served"].includes(o.status));
  const historyTabOrders = orders.filter((o) => ["paid", "cancelled"].includes(o.status));
  const filteredActive = filter === "all" ? activeTabOrders : activeTabOrders.filter((o) => o.status === filter);
  const filteredHistory = historySearch.trim()
    ? historyTabOrders.filter((o) => o.table_number.toLowerCase().includes(historySearch.toLowerCase()))
    : historyTabOrders;
  const filtered = view === "active" ? filteredActive : filteredHistory;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="bg-white rounded-2xl h-24 border border-slate-100" />)}
        </div>
        <div className="bg-white rounded-2xl h-64 border border-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Commandes</h1>
          <p className="text-green-700 text-sm mt-0.5">{orders.length} commande{orders.length > 1 ? "s" : ""} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs mr-1">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
            <span className="text-green-700">{connected ? "En direct" : "Hors ligne"}</span>
          </div>

          {/* Export dropdown */}
          <div className="relative hidden sm:block" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exporter
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-10 overflow-hidden">
                <button onClick={exportExcel}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  <span className="text-base">📊</span> Excel (.xlsx)
                </button>
                <button onClick={exportPDF}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors border-t border-slate-100">
                  <span className="text-base">📄</span> PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              setShowNewOrder(true);
              setOrderError("");
              setOrderForm({ ...EMPTY_ORDER });
              setCartItems([]);
              setMenuSearch("");
              setCustomTable(false);
              if (restaurantId && menuItems.length === 0) {
                const r = await fetch(`/api/menu?restaurant_id=${restaurantId}`);
                if (r.ok) {
                  const cats = await r.json() as Array<{ name: string; menu_items: Array<{ id: string; name: string; price: number; available: boolean }> }>;
                  setMenuItems(cats.flatMap(cat =>
                    (cat.menu_items ?? []).filter(i => i.available).map(i => ({ id: i.id, name: i.name, price: i.price, category: cat.name }))
                  ));
                }
              }
            }}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Modal Nouvelle commande */}
      {showNewOrder && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowNewOrder(false)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Nouvelle commande</h2>
                <button onClick={() => setShowNewOrder(false)} className="p-1.5 text-green-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={createOrder} className="px-6 py-5 space-y-4">
                {orderError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{orderError}</div>
                )}

                {/* Table */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Table <span className="text-red-400">*</span></label>
                  {tables.length > 0 && !customTable ? (
                    <div className="space-y-1.5">
                      <select
                        value={orderForm.table_number}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setCustomTable(true);
                            setOrderForm({ ...orderForm, table_number: "" });
                          } else {
                            setOrderForm({ ...orderForm, table_number: e.target.value });
                          }
                        }}
                        required={!customTable}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="">Sélectionner une table…</option>
                        {[...tables]
                          .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }))
                          .map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        <option value="__custom__">Autre (saisir manuellement)…</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        value={orderForm.table_number}
                        onChange={(e) => setOrderForm({ ...orderForm, table_number: e.target.value })}
                        required
                        autoFocus={customTable}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Ex : Table 5, VIP, Terrasse…"
                      />
                      {tables.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setCustomTable(false); setOrderForm({ ...orderForm, table_number: "" }); }}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          ← Choisir depuis la liste
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Articles */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Articles commandés <span className="text-red-400">*</span>
                  </label>
                  {menuItems.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-sm text-slate-400">
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 8v4M4 12H0m8 0H4m12 0h4m-8 0h4" />
                      </svg>
                      Chargement du menu…
                    </div>
                  ) : (
                    <>
                      <input
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
                        placeholder="Rechercher un plat…"
                      />
                      <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-44">
                        {(() => {
                          const q = menuSearch.toLowerCase();
                          const hits = menuItems.filter(m => m.name.toLowerCase().includes(q));
                          const cats = [...new Set(hits.map(m => m.category))];
                          if (hits.length === 0) return (
                            <div className="py-6 text-center text-sm text-slate-400">Aucun résultat</div>
                          );
                          return cats.map(cat => (
                            <div key={cat}>
                              <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-50 sticky top-0">
                                {cat}
                              </div>
                              {hits.filter(m => m.category === cat).map(m => (
                                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-orange-50 border-b border-slate-50 last:border-0 transition-colors">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                                    <div className="text-xs text-slate-400">{m.price.toLocaleString("fr-FR")} F</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addToCart(m)}
                                    className="ml-3 w-7 h-7 shrink-0 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold text-lg flex items-center justify-center transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>

                      {cartItems.length > 0 && (
                        <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Panier · {cartItems.length} article{cartItems.length > 1 ? "s" : ""}
                          </div>
                          {cartItems.map(c => (
                            <div key={c.item.id} className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100">
                              <div className="text-sm text-slate-700 truncate flex-1">{c.item.name}</div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => changeQty(c.item.id, -1)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center transition-colors"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-sm font-semibold text-slate-900">{c.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(c.item.id, 1)}
                                  className="w-6 h-6 rounded bg-orange-100 hover:bg-orange-200 text-orange-600 font-bold flex items-center justify-center transition-colors"
                                >
                                  +
                                </button>
                              </div>
                              <div className="w-20 text-right text-xs font-semibold text-slate-600 shrink-0">
                                {(c.item.price * c.qty).toLocaleString("fr-FR")} F
                              </div>
                            </div>
                          ))}
                          <div className="px-3 py-3 bg-orange-50 border-t border-orange-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">Total</span>
                            <span className="text-lg font-extrabold text-orange-600">
                              {cartItems.reduce((s, c) => s + c.item.price * c.qty, 0).toLocaleString("fr-FR")} F
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes <span className="text-green-700 font-normal">(optionnel)</span></label>
                  <input
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Sans piment, allergie noix…"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowNewOrder(false)}
                    className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={orderSaving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {orderSaving ? "Création…" : "Créer la commande"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-2xl font-extrabold text-slate-900">{revenue.toLocaleString("fr-FR")} F</div>
          <div className="text-xs text-green-700 mt-0.5">Chiffre du jour</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">🛎️</div>
          <div className="text-2xl font-extrabold text-slate-900">{todayOrders.length}</div>
          <div className="text-xs text-green-700 mt-0.5">Commandes aujourd&apos;hui</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-extrabold text-slate-900">{activeOrders.length}</div>
          <div className="text-xs text-green-700 mt-0.5">En cours maintenant</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setView("active"); setFilter("all"); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          En cours
          {activeTabOrders.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              view === "active" ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"
            }`}>{activeTabOrders.length}</span>
          )}
        </button>
        <button
          onClick={() => { setView("historique"); setFilter("all"); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "historique" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Historique
          {historyTabOrders.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              view === "historique" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
            }`}>{historyTabOrders.length}</span>
          )}
        </button>
      </div>

      {/* Filtres — conditionnel selon l'onglet */}
      {view === "active" ? (
        <div className="flex gap-2 flex-wrap">
          {ACTIVE_STATUS_FILTERS.map(({ key, label }) => {
            const count = key === "all" ? activeTabOrders.length : activeTabOrders.filter((o) => o.status === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  filter === key ? "bg-orange-500 text-white" : "bg-white text-green-700 border border-slate-200 hover:border-orange-300"
                }`}>
                {label} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Période :</span>
            {PERIOD_FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  period === key ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Rechercher par table…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">
            {view === "active"
              ? (filter === "all" ? "Commandes en cours" : STATUS_CONFIG[filter as OrderStatus]?.label)
              : "Historique des commandes"}
          </h2>
          <span className="text-xs text-green-700">{filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-green-700 text-sm">
            {view === "active" ? "Aucune commande en cours" : "Aucune commande dans l'historique"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-green-700 uppercase tracking-wider border-b border-slate-50">
                  <th className="px-4 md:px-6 py-3 font-medium">Table</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden sm:table-cell">Articles</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Total</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Statut</th>
                  <th className="px-4 md:px-6 py-3 font-medium hidden md:table-cell">
                    {view === "active" ? "Durée" : "Date"}
                  </th>
                  <th className="px-4 md:px-6 py-3 font-medium">{view === "active" ? "Action" : "Reçu"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const next = view === "active" ? NEXT_STATUS[order.status] : undefined;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-bold text-slate-900 text-base">
                        {order.table_number}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-green-700 max-w-[200px] truncate hidden sm:table-cell">
                        {order.items}
                      </td>
                      <td className="px-4 md:px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {Number(order.total).toLocaleString("fr-FR")} F
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {order.status === "paid" && (() => {
                            const gp = order.payments?.find(p => p.method === "geniuspay");
                            return gp
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500 border border-violet-500/20">📱 Mobile Money</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">💵 Espèces</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-green-700 text-xs hidden md:table-cell whitespace-nowrap">
                        {view === "active"
                          ? elapsed(order.created_at)
                          : new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {next && (
                            <button
                              onClick={() => {
                                if (order.status === "served") {
                                  // Ouvre le Modal 1 d'encaissement espèces au lieu d'avancer directement
                                  setCashOrder(order);
                                  setAmountReceived("");
                                } else {
                                  advance(order.id, next.status);
                                }
                              }}
                              disabled={updating === order.id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updating === order.id ? "…" : next.label}
                            </button>
                          )}
                          <a
                            href={`/receipt/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Imprimer le reçu"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </a>
                          {view === "active" && (order.status === "pending" || order.status === "preparing") && (
                            <button onClick={() => cancel(order.id)} disabled={updating === order.id}
                              className="text-xs font-semibold px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50">
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* ── MODAL 1 : Encaissement espèces ───────────────────────────────── */}
      {cashOrder && (() => {
        const total = Number(cashOrder.total);
        const received = parseFloat(amountReceived) || 0;
        const change = received - total;
        const canValidate = received >= total;

        return (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => { if (!cashSaving) { setCashOrder(null); setAmountReceived(""); } }}
            />

            {/* Boîte */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

                {/* En-tête */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💵</span>
                    <h2 className="font-bold text-slate-900">Encaissement espèces</h2>
                  </div>
                  <button
                    onClick={() => { if (!cashSaving) { setCashOrder(null); setAmountReceived(""); } }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Fermer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Table + articles en résumé */}
                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Table</span>
                      <span className="font-bold text-slate-800">{cashOrder.table_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Articles</span>
                      <span className="text-right text-slate-700 max-w-[180px] truncate">{cashOrder.items}</span>
                    </div>
                  </div>

                  {/* Total (lecture seule) */}
                  <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <span className="text-sm font-semibold text-orange-700">Total à payer</span>
                    <span className="text-2xl font-extrabold text-orange-600">
                      {total.toLocaleString("fr-FR")} <span className="text-base font-bold">F</span>
                    </span>
                  </div>

                  {/* Somme reçue */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Somme reçue du client <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        autoFocus
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder={`Minimum ${total.toLocaleString("fr-FR")}`}
                        className={`w-full border rounded-xl px-4 py-3 text-lg font-bold pr-12 focus:outline-none focus:ring-2 transition-colors ${
                          amountReceived && !canValidate
                            ? "border-red-300 focus:ring-red-400 bg-red-50 text-red-700"
                            : canValidate
                            ? "border-emerald-300 focus:ring-emerald-400 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 focus:ring-orange-400"
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">F</span>
                    </div>
                    {amountReceived && !canValidate && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> Montant insuffisant ({(total - received).toLocaleString("fr-FR")} F manquants)
                      </p>
                    )}
                  </div>

                  {/* Monnaie à rendre — calcul dynamique */}
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    canValidate && change > 0
                      ? "bg-emerald-50 border-emerald-200"
                      : canValidate && change === 0
                      ? "bg-slate-50 border-slate-200"
                      : "bg-slate-50 border-slate-100 opacity-40"
                  }`}>
                    <span className="text-sm font-semibold text-slate-600">Monnaie à rendre</span>
                    <span className={`text-2xl font-extrabold ${
                      canValidate && change > 0 ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {canValidate ? change.toLocaleString("fr-FR") : "—"} <span className="text-base font-bold">F</span>
                    </span>
                  </div>
                </div>

                {/* Boutons */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => { setCashOrder(null); setAmountReceived(""); }}
                    disabled={cashSaving}
                    className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmCashPayment}
                    disabled={!canValidate || cashSaving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
                  >
                    {cashSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Enregistrement…
                      </span>
                    ) : "Valider l'encaissement"}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
      {/* ── FIN MODAL 1 ───────────────────────────────────────────────────── */}

      {/* ── MODAL 2 : Choix d'impression ─────────────────────────────────── */}
      {showPrintModal && lastCashData && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowPrintModal(false)} />

          {/* Boîte */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

              {/* En-tête */}
              <div className="px-6 py-5 text-center border-b border-slate-100">
                <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Paiement enregistré !</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Table {lastCashData.order.table_number} · {Number(lastCashData.order.total).toLocaleString("fr-FR")} F
                </p>
              </div>

              {/* Récapitulatif rapide */}
              <div className="px-6 py-4 space-y-2 bg-slate-50 border-b border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Somme reçue</span>
                  <span className="font-semibold text-slate-800">{lastCashData.received.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monnaie rendue</span>
                  <span className={`font-bold ${lastCashData.change > 0 ? "text-emerald-600" : "text-slate-500"}`}>
                    {lastCashData.change.toLocaleString("fr-FR")} F
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="px-6 pt-5 pb-2">
                <p className="text-sm font-semibold text-slate-700 text-center mb-4">Que souhaitez-vous imprimer ?</p>

                <div className="space-y-2.5">
                  {/* Bouton Reçu */}
                  <button
                    onClick={() => {
                      // TODO: appeler la fonction d'impression du reçu
                      // Données disponibles : lastCashData.order, lastCashData.received, lastCashData.change
                      // Exemple : printReceipt(lastCashData);
                      window.open(`/receipt/${lastCashData.order.id}`, "_blank");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 rounded-xl transition-colors group"
                  >
                    <span className="text-2xl">🧾</span>
                    <div className="text-left flex-1">
                      <div className="font-bold text-orange-700 text-sm">Imprimer le reçu</div>
                      <div className="text-xs text-orange-500">Reçu client simplifié</div>
                    </div>
                    <svg className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>

                  {/* Bouton Facture */}
                  <button
                    onClick={() => {
                      // TODO: appeler la fonction de génération et d'impression de la facture
                      // Données disponibles : lastCashData.order, lastCashData.received, lastCashData.change
                      // Exemple : printInvoice(lastCashData);
                      window.open(`/receipt/${lastCashData.order.id}?type=invoice`, "_blank");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-colors group"
                  >
                    <span className="text-2xl">📄</span>
                    <div className="text-left flex-1">
                      <div className="font-bold text-blue-700 text-sm">Imprimer la facture</div>
                      <div className="text-xs text-blue-500">Facture officielle détaillée</div>
                    </div>
                    <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bouton Fermer */}
              <div className="px-6 py-5">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="w-full border border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* ── FIN MODAL 2 ───────────────────────────────────────────────────── */}

    </div>
  );
}
