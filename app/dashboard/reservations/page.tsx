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

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const slug = readSlug();
      const res = await fetch(`/api/restaurants/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const restaurant = await res.json();

      const r = await fetch(`/api/reservations?restaurant_id=${restaurant.id}`);
      if (r.ok) setReservations(await r.json());
      setLoading(false);
    }
    init();
  }, []);

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
          <p className="text-slate-400 text-sm mt-0.5">
            {upcoming.length} à venir · {past.length} passée{past.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Réservations à venir */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">À venir</h2>
          <span className="text-xs text-slate-400">{upcoming.length}</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Aucune réservation à venir
          </div>
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
                    <div className="text-xs text-slate-400 mt-0.5">
                      {r.guests} pers. ·{" "}
                      {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}{" "}
                      à {r.time}
                      {r.customer_phone && ` · ${r.customer_phone}`}
                    </div>
                    {r.message && (
                      <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{r.message}&rdquo;</p>
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
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
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
            <h2 className="font-bold text-slate-900 text-sm text-slate-500">Passées / Annulées</h2>
            <span className="text-xs text-slate-400">{past.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {past.slice(0, 10).map((r) => (
              <div key={r.id} className="px-4 md:px-6 py-3 opacity-60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-slate-700 text-sm">{r.customer_name}</span>
                    <span className="text-xs text-slate-400 ml-2">
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
