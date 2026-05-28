"use client";

import { useEffect, useState } from "react";

type OffPeakSlot = {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  days_of_week: number[];
  enabled: boolean;
  created_at: string;
};

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function fmtTime(t: string) {
  return t.slice(0, 5);
}

function DaysBadge({ days }: { days: number[] }) {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) return <span className="text-xs text-slate-500">Tous les jours</span>;
  return (
    <span className="text-xs text-slate-500">
      {sorted.map((d) => DAY_LABELS[d]).join(", ")}
    </span>
  );
}

function isSlotCurrentlyActive(slot: OffPeakSlot): boolean {
  if (!slot.enabled) return false;
  const now = new Date();
  const day = now.getDay();
  if (!slot.days_of_week.includes(day)) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = slot.start_time.split(":").map(Number);
  const [eh, em] = slot.end_time.split(":").map(Number);
  return mins >= sh * 60 + sm && mins < eh * 60 + em;
}

function nextActivationLabel(slot: OffPeakSlot): string {
  if (!slot.enabled) return "";
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = slot.start_time.split(":").map(Number);
  const startMins = sh * 60 + sm;

  if (slot.days_of_week.includes(day) && mins < startMins) {
    return `Actif aujourd'hui à ${fmtTime(slot.start_time)}`;
  }
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    if (slot.days_of_week.includes(nextDay)) {
      const label = i === 1 ? "demain" : DAY_LABELS[nextDay];
      return `Actif ${label} à ${fmtTime(slot.start_time)}`;
    }
  }
  return "";
}

export default function HeuresCreusesPage() {
  const [slots, setSlots] = useState<OffPeakSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [form, setForm] = useState({
    label: "",
    start_time: "14:00",
    end_time: "17:00",
    discount_percent: "20",
    days_of_week: ALL_DAYS,
  });

  async function load() {
    const res = await fetch("/api/off-peak-hours");
    if (res.ok) setSlots(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Horloge pour mettre à jour le statut actif toutes les 30s
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(iv);
  }, []);

  // now est utilisé pour forcer le re-render lors du calcul du statut
  void now;

  function toggleDay(day: number) {
    setForm((prev) => {
      const has = prev.days_of_week.includes(day);
      if (has && prev.days_of_week.length === 1) return prev;
      return {
        ...prev,
        days_of_week: has
          ? prev.days_of_week.filter((d) => d !== day)
          : [...prev.days_of_week, day],
      };
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/off-peak-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setSlots((prev) => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setShowForm(false);
      setForm({ label: "", start_time: "14:00", end_time: "17:00", discount_percent: "20", days_of_week: ALL_DAYS });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(slot: OffPeakSlot) {
    setTogglingId(slot.id);
    try {
      const res = await fetch("/api/off-peak-hours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, enabled: !slot.enabled }),
      });
      if (res.ok) {
        setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, enabled: !s.enabled } : s));
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/off-peak-hours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setSlots((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const currentTime = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Heures creuses</h1>
          <p className="text-slate-500 text-sm mt-1">
            Programmez des réductions automatiques sur toute la carte pendant des créneaux définis.
            La bannière et les prix réduits apparaissent <strong>uniquement pendant le créneau actif</strong>.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* Heure actuelle */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Heure actuelle : <strong className="text-slate-600">{currentTime}</strong>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Nouveau créneau</h2>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Libellé
              </label>
              <input
                required
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex : Pause déjeuner, Happy Hour…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Début
                </label>
                <input
                  required
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Fin
                </label>
                <input
                  required
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Réduction (%)
              </label>
              <input
                required
                type="number"
                min={1}
                max={80}
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                placeholder="20"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-slate-400 mt-1">Entre 1% et 80% de réduction sur tous les plats</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Jours de la semaine
              </label>
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
                      form.days_of_week.includes(day)
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
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

      {/* Liste des créneaux */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Chargement…</div>
      ) : slots.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="text-5xl mb-3">⏰</div>
          <p className="text-slate-500 font-medium text-sm">Aucun créneau configuré</p>
          <p className="text-slate-400 text-xs mt-1">
            Ajoutez un créneau pour activer les réductions automatiques
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Créer mon premier créneau
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => {
            const active = isSlotCurrentlyActive(slot);
            const nextLabel = !active ? nextActivationLabel(slot) : "";
            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-all ${
                  active
                    ? "border-orange-300 shadow-md shadow-orange-50"
                    : slot.enabled
                    ? "border-slate-200"
                    : "border-slate-100 opacity-60"
                }`}
              >
                {/* Badge réduction */}
                <div className={`shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                  active ? "bg-orange-500" : "bg-orange-50"
                }`}>
                  <span className={`text-lg font-extrabold ${active ? "text-white" : "text-orange-500"}`}>
                    −{slot.discount_percent}%
                  </span>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{slot.label}</span>
                    {active && (
                      <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        Actif maintenant
                      </span>
                    )}
                    {!active && slot.enabled && nextLabel && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                        {nextLabel}
                      </span>
                    )}
                    {!slot.enabled && (
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                        Désactivé
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {fmtTime(slot.start_time)} → {fmtTime(slot.end_time)}
                  </p>
                  <DaysBadge days={slot.days_of_week} />
                  {active && (
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      Les prix sont réduits sur votre page publique en ce moment
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle actif */}
                  <button
                    onClick={() => handleToggle(slot)}
                    disabled={togglingId === slot.id}
                    title={slot.enabled ? "Désactiver" : "Activer"}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                      slot.enabled ? "bg-orange-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        slot.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={deletingId === slot.id}
                    title="Supprimer"
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    {deletingId === slot.id ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      {slots.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Comment ça marche ?</p>
          <ul className="space-y-1 text-xs text-amber-700 list-disc list-inside">
            <li>La bannière orange et les prix barrés n&apos;apparaissent <strong>que pendant le créneau actif</strong></li>
            <li>En dehors du créneau, votre page publique s&apos;affiche normalement — c&apos;est voulu</li>
            <li>Un compte à rebours &quot;Offre se termine dans X min&quot; est visible par les clients</li>
            <li>Pour tester : configurez un créneau qui inclut l&apos;heure actuelle ({currentTime})</li>
          </ul>
        </div>
      )}
    </div>
  );
}
