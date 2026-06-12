"use client";

import { useEffect, useState } from "react";
import PlanGate from "../components/PlanGate";

type Campaign = {
  id: string;
  subject: string;
  body_text: string;
  recipient_count: number;
  sent_at: string;
};

export default function NewsletterPage() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/newsletter/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setSubscriberCount(d.subscriber_count ?? 0);
        setCampaigns(d.campaigns ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !bodyText.trim()) return;
    setSending(true);
    setSendResult(null);
    setSendError("");
    try {
      const res = await fetch("/api/dashboard/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body_text: bodyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? "Erreur lors de l'envoi");
      } else if (data.sent === 0 && data.failed > 0) {
        const detail = data.errors?.[0] ?? "Erreur EmailJS inconnue";
        setSendError(`Échec d'envoi — ${detail}`);
      } else {
        setSendResult(data);
        setSubject("");
        setBodyText("");
        const newCampaign: Campaign = {
          id: crypto.randomUUID(),
          subject: subject.trim(),
          body_text: bodyText.trim(),
          recipient_count: data.sent,
          sent_at: new Date().toISOString(),
        };
        setCampaigns((prev) => [newCampaign, ...prev]);
        setSubscriberCount((prev) => prev);
      }
    } catch {
      setSendError("Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  const canSend = subject.trim().length > 0 && bodyText.trim().length > 0 && !sending && (subscriberCount ?? 0) > 0;

  return (
    <PlanGate feature="Newsletter clients" requiredPlans={["pro"]}>
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Newsletter</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Envoyez des emails à tous vos clients abonnés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? "…" : subscriberCount}
          </div>
          <div className="text-sm text-slate-500 mt-1">Abonnés avec email</div>
          {!loading && (subscriberCount ?? 0) === 0 && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-2 py-1.5 leading-relaxed">
              Les clients renseignent leur email lors d&apos;une commande. Ils apparaîtront ici automatiquement.
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? "…" : campaigns.length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Campagnes envoyées</div>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400 mb-5">
          Nouvelle campagne
        </h2>

        {sendResult && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>
              <strong>{sendResult.sent}</strong> email{sendResult.sent > 1 ? "s" : ""} envoyé{sendResult.sent > 1 ? "s" : ""}
              {sendResult.failed > 0 && ` · ${sendResult.failed} échec${sendResult.failed > 1 ? "s" : ""}`}
            </span>
          </div>
        )}

        {sendError && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {sendError}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Sujet de l&apos;email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setSendResult(null); }}
              placeholder="Ex : Nouvelle carte d'été 🌿, Promo du week-end…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Message
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => { setBodyText(e.target.value); setSendResult(null); }}
              placeholder={`Bonjour,\n\nNous avons le plaisir de vous annoncer…\n\nÀ très bientôt !`}
              rows={8}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none transition"
            />
            <p className="text-xs text-slate-400 mt-1">
              Le message sera envoyé tel quel. Les sauts de ligne sont respectés.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours…
              </>
            ) : (subscriberCount ?? 0) === 0 ? (
              "Aucun abonné pour l'instant"
            ) : (
              <>
                📧 Envoyer à {subscriberCount} abonné{(subscriberCount ?? 0) > 1 ? "s" : ""}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Historique */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-400">
              Historique des campagnes
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {campaigns.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{c.subject}</div>
                  <div className="text-slate-400 text-xs mt-0.5 truncate">{c.body_text}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-slate-700">
                    {c.recipient_count} destinataire{c.recipient_count > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(c.sent_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  );
}
