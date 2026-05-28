"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  order_count: number;
  last_order_at: string;
  created_at: string;
};

const TEMPLATES = [
  { label: "Menu du jour", text: "Bonjour {nom} ! 🍽️ Découvrez notre menu du jour chez {restaurant}. Venez nous rendre visite !" },
  { label: "Promotion", text: "Bonjour {nom} ! 🎉 Profitez de notre promotion spéciale ce weekend. On vous attend !" },
  { label: "Remerciement", text: "Bonjour {nom} ! 🙏 Merci pour votre visite. Votre satisfaction est notre priorité. À très bientôt !" },
  { label: "Événement", text: "Bonjour {nom} ! 🎊 Nous organisons un événement spécial. Réservez votre place dès maintenant !" },
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/auth/restaurant").then((r) => r.json()),
    ]).then(([c, r]) => {
      setCustomers(Array.isArray(c) ? c : []);
      setRestaurantName(r?.name ?? "");
      setLoading(false);
    });
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  function applyTemplate(tpl: string) {
    setMessage(tpl.replace("{restaurant}", restaurantName));
  }

  async function sendMessages() {
    const phones = customers
      .filter((c) => selected.has(c.id))
      .map((c) => c.phone);
    if (!phones.length || !message.trim()) return;
    setSending(true);
    const res = await fetch("/api/customers/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phones, message }),
    });
    const data = await res.json();
    setSendResult(data);
    setSending(false);
  }

  function closeModal() {
    setShowModal(false);
    setMessage("");
    setSendResult(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {customers.length} client{customers.length > 1 ? "s" : ""} enregistré{customers.length > 1 ? "s" : ""}
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Envoyer WhatsApp ({selected.size})
          </button>
        )}
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="font-bold text-slate-900 mb-2">Aucun client enregistré</h3>
          <p className="text-slate-500 text-sm">
            Les clients qui renseignent leur nom et téléphone lors d&apos;une commande apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Search + select all */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou téléphone…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            <button
              onClick={selectAll}
              className="text-sm text-slate-500 hover:text-orange-500 font-medium whitespace-nowrap transition-colors"
            >
              {selected.size === filtered.length && filtered.length > 0 ? "Désélectionner" : "Tout sélectionner"}
            </button>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">Aucun résultat</div>
          ) : (
            filtered.map((c, i) => (
              <div
                key={c.id}
                onClick={() => toggleSelect(c.id)}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                  selected.has(c.id) ? "bg-orange-50" : "hover:bg-slate-50"
                } ${i < filtered.length - 1 ? "border-b border-slate-100" : ""}`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected.has(c.id) ? "bg-orange-500 border-orange-500" : "border-slate-300"
                }`}>
                  {selected.has(c.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{c.phone}</div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <div className="text-slate-700 text-sm font-bold">
                    {c.order_count} commande{c.order_count > 1 ? "s" : ""}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">Dernière : {fmt(c.last_order_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* WhatsApp modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={sendResult ? closeModal : undefined} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              {sendResult ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Messages envoyés !</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    {sendResult.sent} message{sendResult.sent > 1 ? "s" : ""} envoyé{sendResult.sent > 1 ? "s" : ""} sur {sendResult.total}
                  </p>
                  <button onClick={closeModal} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Envoyer un message WhatsApp</h2>
                      <p className="text-slate-500 text-sm">{selected.size} destinataire{selected.size > 1 ? "s" : ""}</p>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Templates */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Modèles rapides</p>
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.label}
                          onClick={() => applyTemplate(t.text)}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 hover:border-orange-400 hover:text-orange-600 transition-colors"
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez votre message… Utilisez {nom} pour le prénom du client."
                    rows={5}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition mb-4"
                  />

                  <p className="text-xs text-slate-400 mb-4">
                    💡 <strong>{"{nom}"}</strong> sera remplacé par le prénom de chaque client automatiquement.
                  </p>

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
                      Annuler
                    </button>
                    <button
                      onClick={sendMessages}
                      disabled={sending || !message.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi…</>
                      ) : (
                        <>Envoyer via WhatsApp</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
