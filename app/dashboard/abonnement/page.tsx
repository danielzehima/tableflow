"use client";

import { useEffect, useState } from "react";

type PlanSetting = {
  plan: string; label: string; price: number; currency: string;
  description: string; features: string[]; highlight: boolean; badge: string | null;
};

type Payment = {
  id: string; plan: string; amount: number; currency: string;
  method: string; status: string; reference: string; created_at: string;
};

type Restaurant = {
  plan: string; plan_expires_at: string | null; status: string;
};

const METHOD_INFO: Record<string, { label: string; color: string; icon: string; placeholder: string }> = {
  wave: { label: "Wave", color: "bg-yellow-400", icon: "W", placeholder: "+221 77 000 00 00", },
  orange_money: { label: "Orange Money", color: "bg-orange-500", icon: "OM", placeholder: "+221 76 000 00 00", },
  free_money: { label: "Free Money", color: "bg-emerald-500", icon: "FM", placeholder: "+221 78 000 00 00", },
  carte: { label: "Carte bancaire", color: "bg-blue-600", icon: "CB", placeholder: "", },
  geniuspay: { label: "GeniusPay", color: "bg-violet-600", icon: "GP", placeholder: "", },
};

const PLAN_LABELS: Record<string, string> = { free: "Gratuit", starter: "Starter", pro: "Pro" };
const PLAN_COLORS: Record<string, string> = {
  free: "text-slate-600 bg-slate-100 border-slate-200",
  starter: "text-blue-600 bg-blue-50 border-blue-200",
  pro: "text-orange-600 bg-orange-50 border-orange-200",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function AbonnementPage() {
  const [plans, setPlans] = useState<PlanSetting[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanSetting | null>(null);
  const [method, setMethod] = useState<string>("wave");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [reference, setReference] = useState("");
  const [payError, setPayError] = useState("");

  async function load() {
    const [plansRes, historyRes, restaurantRes] = await Promise.all([
      fetch("/api/plans"),
      fetch("/api/paiement/history"),
      fetch("/api/auth/restaurant"),
    ]);
    if (plansRes.ok) setPlans(await plansRes.json());
    if (historyRes.ok) setPayments(await historyRes.json());
    if (restaurantRes.ok) setRestaurant(await restaurantRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function pay() {
    if (!selectedPlan) return;
    setStep("processing");
    setPayError("");

    const res = await fetch("/api/paiement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan.plan }),
    });

    if (res.ok) {
      const data = await res.json();
      // Rediriger vers la page de paiement CinetPay
      window.location.href = data.payment_url;
    } else {
      const d = await res.json();
      setPayError(d.error ?? "Erreur lors du paiement");
      setStep("error");
    }
  }

  function closeModal() {
    setSelectedPlan(null);
    setStep("idle");
    setPhone("");
    setMethod("wave");
    setPayError("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentPlan = restaurant?.plan ?? "free";

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonnement</h1>
        <p className="text-green-700 text-sm mt-0.5">Gérez votre plan et consultez votre historique de paiements.</p>
      </div>

      {/* Current plan */}
      {restaurant && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-green-700 text-xs font-semibold uppercase tracking-wide mb-1">Plan actuel</p>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${PLAN_COLORS[currentPlan] ?? PLAN_COLORS.free}`}>
                  {PLAN_LABELS[currentPlan] ?? currentPlan}
                </span>
                {restaurant.plan_expires_at && (
                  <span className="text-green-700 text-xs">
                    Expire le {fmt(restaurant.plan_expires_at)}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${restaurant.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {restaurant.status === "active" ? "Actif" : "Suspendu"}
            </span>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Choisir un plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            return (
              <div key={plan.plan}
                className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
                  plan.highlight ? "border-orange-400 shadow-lg shadow-orange-50" : "border-slate-100"
                } ${isCurrent ? "ring-2 ring-orange-500/30" : ""}`}>
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    Plan actuel
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-slate-900">{plan.label}</h3>
                  <p className="text-green-700 text-xs mt-0.5">{plan.description}</p>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString("fr-FR")} ${plan.currency}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-green-700">/mois</span>}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-orange-500 shrink-0 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { if (!isCurrent && plan.price > 0) setSelectedPlan(plan); }}
                  disabled={isCurrent || plan.price === 0}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isCurrent ? "bg-emerald-100 text-emerald-700 cursor-default"
                    : plan.price === 0 ? "bg-slate-100 text-green-700 cursor-default"
                    : plan.highlight ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  }`}>
                  {isCurrent ? "Plan actuel" : plan.price === 0 ? "Gratuit" : "Souscrire"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-4">Historique des paiements</h2>
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {payments.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 px-5 py-4 ${i < payments.length - 1 ? "border-b border-slate-100" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${METHOD_INFO[p.method]?.color ?? "bg-slate-400"}`}>
                  {METHOD_INFO[p.method]?.icon ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 text-sm font-semibold">{PLAN_LABELS[p.plan] ?? p.plan} — {METHOD_INFO[p.method]?.label ?? p.method}</div>
                  <div className="text-green-700 text-xs">{p.reference} · {fmt(p.created_at)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-slate-800 text-sm font-bold">{p.amount.toLocaleString("fr-FR")} {p.currency}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {p.status === "success" ? "Payé" : "Échoué"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selectedPlan && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={step === "idle" ? closeModal : undefined} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">

              {step === "success" ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Paiement confirmé !</h2>
                  <p className="text-green-700 text-sm mb-1">Votre plan <strong>{selectedPlan.label}</strong> est maintenant actif.</p>
                  <p className="text-green-700 text-xs font-mono mb-6">Réf : {reference}</p>
                  <button onClick={closeModal} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    Fermer
                  </button>
                </div>
              ) : step === "processing" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-5" />
                  <p className="text-slate-700 font-semibold">Redirection vers GeniusPay…</p>
                  <p className="text-slate-400 text-sm mt-1">Vous allez être redirigé vers la page de paiement sécurisé.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Confirmer l&apos;abonnement</h2>
                      <p className="text-slate-500 text-sm">Plan <strong>{selectedPlan.label}</strong> — {selectedPlan.price.toLocaleString("fr-FR")} {selectedPlan.currency}/mois</p>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {payError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{payError}</div>
                  )}

                  {/* Moyens de paiement disponibles */}
                  <div className="mb-5 bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Moyens de paiement acceptés</p>
                    <p className="text-xs text-slate-400 mb-3">Vous choisirez votre méthode sur la page de paiement GeniusPay.</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Orange Money", color: "bg-orange-500" },
                        { label: "Wave", color: "bg-yellow-400" },
                        { label: "MTN MoMo", color: "bg-yellow-500" },
                        { label: "Moov Money", color: "bg-blue-500" },
                        { label: "Carte Visa/MC", color: "bg-blue-700" },
                      ].map((m) => (
                        <span key={m.label} className={`${m.color} text-white text-[10px] font-semibold px-2.5 py-1 rounded-full select-none pointer-events-none`}>
                          {m.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-colors">
                      Annuler
                    </button>
                    <button onClick={pay} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                      Payer {selectedPlan.price.toLocaleString("fr-FR")} {selectedPlan.currency}
                    </button>
                  </div>

                  <p className="text-center text-slate-400 text-xs mt-4">
                    Paiement sécurisé via GeniusPay
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
