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

const statusStyle: Record<string, string> = {
  Confirmée: "bg-green-50 text-green-700",
  "En attente": "bg-amber-50 text-amber-700",
  Annulée: "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
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
  const [view, setView] = useState<"upcoming" | "historique">("upcoming");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState<"30" | "90" | "365" | "all">("30");

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
      const res = await fetch("/api/auth/restaurant");
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
        customer_email: form.customer_email.trim() || undefined,
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

  function exportCSV() {
    const headers = ["Client", "Téléphone", "Date", "Heure", "Personnes", "Statut", "Message"];
    const rows = reservations.map((r) => [
      `"${r.customer_name}"`,
      r.customer_phone,
      new Date(r.date).toLocaleDateString("fr-FR"),
      r.time,
      r.guests,
      r.status,
      `"${(r.message ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservations-${new Date().toLocaleDateString("fr-CA")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = reservations.filter((r) => r.date >= today && r.status !== "Annulée");
  const past = reservations.filter((r) => r.date < today || r.status === "Annulée");

  const historyFiltered = (() => {
    let list = past;
    if (historyPeriod !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(historyPeriod));
      const cutoffStr = cutoff.toISOString().split("T")[0];
      list = list.filter((r) => r.date >= cutoffStr || r.status === "Annulée");
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter((r) =>
        r.customer_name.toLowerCase().includes(q) || r.customer_phone?.includes(q)
      );
    }
    return list;
  })();

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
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter CSV
          </button>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setView("upcoming")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "upcoming" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          À venir
          {upcoming.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              view === "upcoming" ? "bg-orange-100 text-orange-600" : "bg-slate-200 text-slate-500"
            }`}>{upcoming.length}</span>
          )}
        </button>
        <button
          onClick={() => setView("historique")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "historique" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Historique
          {past.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              view === "historique" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
            }`}>{past.length}</span>
          )}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="text-green-700 font-normal">(optionnel — confirmation envoyée si renseigné)</span>
                  </label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="client@email.com"
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

      {/* Contenu selon l'onglet */}
      {view === "upcoming" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Réservations à venir</h2>
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
      ) : (
        <>
          {/* Filtres historique */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Période :</span>
              {([["30", "30 jours"], ["90", "3 mois"], ["365", "1 an"], ["all", "Tout"]] as [typeof historyPeriod, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setHistoryPeriod(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    historyPeriod === key ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
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
                placeholder="Nom ou téléphone…"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Historique des réservations</h2>
              <span className="text-xs text-green-700">{historyFiltered.length}</span>
            </div>

            {historyFiltered.length === 0 ? (
              <div className="px-6 py-12 text-center text-green-700 text-sm">Aucune réservation dans l&apos;historique</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-green-700 uppercase tracking-wider border-b border-slate-50">
                      <th className="px-4 md:px-6 py-3 font-medium">Client</th>
                      <th className="px-4 md:px-6 py-3 font-medium hidden sm:table-cell">Date</th>
                      <th className="px-4 md:px-6 py-3 font-medium hidden md:table-cell">Personnes</th>
                      <th className="px-4 md:px-6 py-3 font-medium">Statut</th>
                      <th className="px-4 md:px-6 py-3 font-medium hidden lg:table-cell">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyFiltered.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="font-semibold text-slate-900 text-sm">{r.customer_name}</div>
                          {r.customer_phone && <div className="text-xs text-slate-400 mt-0.5">{r.customer_phone}</div>}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-green-700 text-sm hidden sm:table-cell whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} à {r.time}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-green-700 text-sm hidden md:table-cell">
                          {r.guests} pers.
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate hidden lg:table-cell">
                          {r.message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
