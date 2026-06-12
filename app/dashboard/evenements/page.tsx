"use client";

import { useEffect, useState } from "react";
import { useMoney, useCurrency } from "../components/CurrencyContext";
import { currencySymbol } from "../../lib/currency";

type EventReservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  guests_count: number;
  status: string;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  image_url: string | null;
  max_guests: number | null;
  price: number;
  is_active: boolean;
  created_at: string;
  event_reservations: EventReservation[];
};

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function seatsTaken(ev: Event) {
  return ev.event_reservations.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.guests_count, 0);
}

const EMPTY_FORM = {
  title: "",
  description: "",
  event_date: "",
  event_time: "19:00",
  image_url: "",
  max_guests: "",
  price: "0",
};

export default function EvenementsPage() {
  const money = useMoney();
  const currency = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = new Date().toISOString().split("T")[0];

  async function load() {
    const res = await fetch("/api/events");
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          max_guests: form.max_guests ? Number(form.max_guests) : null,
          price: Number(form.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setEvents((prev) => [...prev, { ...data, event_reservations: [] }].sort(
        (a, b) => a.event_date.localeCompare(b.event_date)
      ));
      setShowForm(false);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ev: Event) {
    setTogglingId(ev.id);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ev.id, is_active: !ev.is_active }),
      });
      if (res.ok) {
        setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, is_active: !e.is_active } : e));
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet événement et toutes ses réservations ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const upcoming = events.filter((e) => e.event_date >= today);
  const past = events.filter((e) => e.event_date < today);
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Événements</h1>
          <p className="text-slate-500 text-sm mt-1">
            Annoncez vos soirées, brunchs, dîners spéciaux. Vos clients peuvent s&apos;inscrire directement depuis votre page publique.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Créer
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Nouvel événement</h2>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Titre *
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Soirée Jazz, Brunch dominical, Dîner Saint-Valentin…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrivez l'ambiance, le programme, le menu…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Date *
                </label>
                <input
                  required
                  type="date"
                  value={form.event_date}
                  min={today}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Heure *
                </label>
                <input
                  required
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Places max
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.max_guests}
                  onChange={(e) => setForm({ ...form, max_guests: e.target.value })}
                  placeholder="Illimité si vide"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Prix ({currencySymbol(currency)})
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0 = gratuit"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                URL image (optionnel)
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "upcoming" ? `À venir (${upcoming.length})` : `Passés (${past.length})`}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chargement…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-slate-500 font-medium text-sm">
            {tab === "upcoming" ? "Aucun événement à venir" : "Aucun événement passé"}
          </p>
          {tab === "upcoming" && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Créer mon premier événement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((ev) => {
            const taken = seatsTaken(ev);
            const full = ev.max_guests !== null && taken >= ev.max_guests;
            const isExpanded = expandedId === ev.id;

            return (
              <div
                key={ev.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
                  ev.is_active ? "border-slate-200" : "border-slate-100 opacity-60"
                }`}
              >
                {/* Image */}
                {ev.image_url && (
                  <div className="h-32 w-full overflow-hidden">
                    <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Icône date */}
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-orange-50 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-orange-400 uppercase leading-none">
                        {new Date(ev.event_date + "T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                      <span className="text-lg font-extrabold text-orange-600 leading-none">
                        {new Date(ev.event_date + "T00:00:00").getDate()}
                      </span>
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{ev.title}</span>
                        {!ev.is_active && (
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                            Masqué
                          </span>
                        )}
                        {full && (
                          <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-semibold">
                            Complet
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {fmtDate(ev.event_date)} à {fmtTime(ev.event_time)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {ev.price > 0 ? (
                          <span className="text-xs font-bold text-orange-600">
                            {money(ev.price)}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 font-semibold">Gratuit</span>
                        )}
                        <span className="text-xs text-slate-400">
                          {taken} inscrits{ev.max_guests ? ` / ${ev.max_guests} places` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(ev)}
                        disabled={togglingId === ev.id}
                        title={ev.is_active ? "Masquer" : "Afficher"}
                        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                          ev.is_active ? "bg-orange-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            ev.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        disabled={deletingId === ev.id}
                        title="Supprimer"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        {deletingId === ev.id ? (
                          <span className="text-xs">…</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed">{ev.description}</p>
                  )}

                  {/* Réservations */}
                  {ev.event_reservations.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="text-xs text-orange-600 font-semibold hover:underline"
                      >
                        {isExpanded ? "Masquer" : "Voir"} les inscriptions ({ev.event_reservations.filter(r => r.status === "confirmed").length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Liste inscriptions dépliée */}
                {isExpanded && ev.event_reservations.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-2">
                    {ev.event_reservations
                      .filter((r) => r.status === "confirmed")
                      .map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs text-slate-700 py-1">
                          <span className="font-medium">{r.customer_name}</span>
                          <span className="text-slate-500">{r.customer_phone}</span>
                          <span className="bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-full border border-orange-100">
                            {r.guests_count} pers.
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
