"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Table = { id: string; name: string };

const STORAGE_KEY = "tableflow_base_url";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // URL de base pour les QR codes
  const [baseUrl, setBaseUrl] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

  useEffect(() => {
    // Charger l'URL sauvegardée ou utiliser l'origin
    const saved = localStorage.getItem(STORAGE_KEY);
    const origin = window.location.origin;
    setBaseUrl(saved || origin);
    setTempUrl(saved || origin);

    async function init() {
      const res = await fetch("/api/auth/restaurant");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setSlug(data.slug ?? "");
      setRestaurantId(data.id);
      await loadTables(data.id);
      setLoading(false);
    }
    init();
  }, []);

  async function loadTables(rid: string) {
    const r = await fetch(`/api/tables?restaurant_id=${rid}`);
    if (r.ok) setTables(await r.json());
  }

  function saveBaseUrl() {
    const url = tempUrl.trim().replace(/\/$/, ""); // Supprimer le / final
    localStorage.setItem(STORAGE_KEY, url);
    setBaseUrl(url);
    setEditingUrl(false);
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: restaurantId, name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      setAdding(false);
      await loadTables(restaurantId);
    } else {
      const d = await res.json();
      setError(d.error ?? "Erreur");
    }
    setSaving(false);
  }

  async function deleteTable(id: string, name: string) {
    if (!confirm(`Supprimer la table "${name}" ?`)) return;
    setDeletingId(id);
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    setTables((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  function downloadQR(tableName: string) {
    const canvas = document.getElementById(`qr-${tableName}`) as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-${tableName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-2xl h-24 border border-slate-100" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-56 border border-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Tables & QR Codes</h1>
          <p className="text-green-700 text-sm mt-0.5">
            {tables.length} table{tables.length > 1 ? "s" : ""} — les clients scannent pour voir le menu
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle table
        </button>
      </div>

      {/* ── Configuration URL ── */}
      <div className={`rounded-2xl border p-4 ${isLocalhost ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}>
        <div className="flex items-start gap-3">
          <div className={`text-xl shrink-0 mt-0.5`}>
            {isLocalhost ? "⚠️" : "🔗"}
          </div>
          <div className="flex-1 min-w-0">
            {isLocalhost && (
              <p className="text-amber-800 text-sm font-semibold mb-1">
                URL locale détectée — le QR code ne fonctionnera pas sur un autre appareil
              </p>
            )}
            <p className="text-slate-600 text-xs mb-3">
              {isLocalhost
                ? "Renseigne l'URL de ton site en ligne (ex : après déploiement sur Vercel) pour que le QR code fonctionne sur les téléphones."
                : "URL utilisée dans les QR codes :"}
            </p>

            {editingUrl ? (
              <div className="flex gap-2">
                <input
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="https://monsite.vercel.app"
                />
                <button onClick={saveBaseUrl}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                  OK
                </button>
                <button onClick={() => { setEditingUrl(false); setTempUrl(baseUrl); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-sm transition-colors">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className={`text-xs px-3 py-1.5 rounded-lg font-mono flex-1 truncate ${isLocalhost ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
                  {baseUrl}/{slug}?table=…
                </code>
                <button
                  onClick={() => { setEditingUrl(true); setTempUrl(baseUrl); }}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 transition-colors"
                >
                  Modifier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal ajout table */}
      {adding && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setAdding(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Nouvelle table</h2>
              {error && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <form onSubmit={addTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la table</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Ex : Table 1, VIP, Terrasse…"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setAdding(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {saving ? "Ajout…" : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {tables.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-5xl mb-3">📱</div>
          <p className="text-slate-700 font-semibold mb-1">Aucune table configurée</p>
          <p className="text-green-700 text-sm mb-4">
            Ajoutez vos tables pour générer des QR codes à imprimer et poser sur chaque table.
          </p>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Ajouter la première table
          </button>
        </div>
      )}

      {/* QR Grid */}
      {tables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {tables.map((table) => {
            const qrUrl = `${baseUrl}/${slug}?table=${encodeURIComponent(table.name)}`;
            return (
              <div key={table.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center gap-4">
                <div className="font-bold text-slate-900 text-base">{table.name}</div>

                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <QRCodeCanvas
                    id={`qr-${table.name}`}
                    value={qrUrl}
                    size={160}
                    level="M"
                    marginSize={1}
                  />
                </div>

                <p className="text-[10px] text-green-700 text-center break-all leading-relaxed px-1">
                  {qrUrl}
                </p>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => downloadQR(table.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger
                  </button>
                  <button
                    onClick={() => deleteTable(table.id, table.name)}
                    disabled={deletingId === table.id}
                    className="p-2 rounded-lg text-green-700 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
