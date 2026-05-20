"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  guests: number;
  message: string;
  status: "En attente" | "Confirmée" | "Annulée";
  created_at: string;
};

function readSlug(): string {
  try {
    const match = document.cookie.match(/(?:^|;\s*)restaurant_slug=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "le-bonus";
  } catch {
    return "le-bonus";
  }
}

const statusStyle: Record<string, string> = {
  Confirmée: "bg-green-50 text-green-700",
  "En attente": "bg-amber-50 text-amber-700",
  Annulée: "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  customer_name: "",
  customer_phone: "",
  date: "",
  time: "",
  guests: "2",
  message: "",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Modal nouvelle réservation
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadReservations(rid: string) {
    const r = await fetch(`/api/reservations?restaurant_id=${rid}`);
    if (r.ok) setReservations(await r.json());
  }

  useEffect(() => {
    async function init() {
      const slug = readSlug();
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const restaurant = await res.json();
      setRestaurantId(restaurant.id);
      await loadReservations(restaurant.id);
      setLoading(false);
    }
    init();
  }, []);

  async function createReservation(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        date: form.date,
        time: form.time,
        guests: Number(form.guests),
        message: form.message.trim(),
      }),
    });

    if (res.ok) {
      setShowNew(false);
      setForm({ ...EMPTY_FORM });
      await loadReservations(restaurantId);
    } else {
      const d = await res.json();
      setFormError(d.error ?? "Erreur lors de la création");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: status as Reservation["status"] } : r))
      );
    }
    setUpdating(null);
  }

  async function deleteReservation(id: string) {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setReservations((prev) => prev.filter((r) => r.id !== id));
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter((r) => r.date >= today && r.status !== "Annulée");
  const past = reservations.filter((r) => r.date < today || r.status === "Annulée");

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white rounded-2xl h-20 border border-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Réservations</h1>
          <p className="text-green-700 text-sm mt-0.5">
            {upcoming.length} à venir · {past.length} passée{past.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(true); setFormError(""); setForm({ ...EMPTY_FORM }); }}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle réservation
        </button>
      </div>

      {/* Modal nouvelle réservation */}
      {showNew && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Nouvelle réservation</h2>
                <button onClick={() => setShowNew(false)} className="p-1.5 text-green-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={createReservation} className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{formError}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom du client <span className="text-red-400">*</span></label>
                    <input
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Ex : Amadou Diallo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Téléphone <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={form.date}
                      min={today}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure <span className="text-red-400">*</span></label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de personnes <span className="text-red-400">*</span></label>
                  <input
                    type="number" min="1" max="50"
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Message <span className="text-green-700 font-normal">(optionnel)</span></label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    placeholder="Occasion spéciale, préférences…"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowNew(false)}
                    className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {saving ? "Création…" : "Créer la réservation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Réservations à venir */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">À venir</h2>
          <span className="text-xs text-green-700">{upcoming.length}</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center text-green-700 text-sm">Aucune réservation à venir</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map((r) => (
              <div key={r.id} className="px-4 md:px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{r.customer_name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-xs text-green-700 mt-0.5">
                      {r.guests} pers. ·{" "}
                      {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}{" "}
                      à {r.time}
                      {r.customer_phone && ` · ${r.customer_phone}`}
                    </div>
                    {r.message && (
                      <p className="text-xs text-green-700 mt-1 italic">&ldquo;{r.message}&rdquo;</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === "En attente" && (
                      <button
                        onClick={() => updateStatus(r.id, "Confirmée")}
                        disabled={updating === r.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
                      >
                        {updating === r.id ? "…" : "Confirmer"}
                      </button>
                    )}
                    {r.status !== "Annulée" && (
                      <button
                        onClick={() => updateStatus(r.id, "Annulée")}
                        disabled={updating === r.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    )}
                    <button
                      onClick={() => deleteReservation(r.id)}
                      className="text-green-700 hover:text-red-500 transition-colors p-1"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Réservations passées */}
      {past.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm text-green-700">Passées / Annulées</h2>
            <span className="text-xs text-green-700">{past.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {past.slice(0, 10).map((r) => (
              <div key={r.id} className="px-4 md:px-6 py-3 opacity-60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-slate-700 text-sm">{r.customer_name}</span>
                    <span className="text-xs text-green-700 ml-2">
                      {r.guests} pers. · {new Date(r.date).toLocaleDateString("fr-FR")} à {r.time}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
