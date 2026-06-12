import { getSession, clearSessionCookie } from "../../lib/auth-server";
import { supabase } from "../../lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SuspendedPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Récupérer le motif de suspension pour personnaliser le message
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, suspension_reason, plan_expires_at")
    .eq("id", session.restaurantId)
    .single();

  const reason = (restaurant as { suspension_reason?: string | null })?.suspension_reason ?? "admin";

  // Contenu selon le motif
  const content = {
    trial_expired: {
      headerColor: "bg-gradient-to-br from-orange-500 to-amber-500",
      icon: "⏰",
      title: "Votre période d'essai est terminée",
      subtitle: "14 jours d'accès complet utilisés",
      message: "Merci d'avoir testé TableFlow ! Pour continuer à gérer votre restaurant, vos commandes, réservations et toutes vos données, choisissez un plan adapté à votre activité.",
      reasons: null,
      ctaLabel: "Choisir un plan",
      ctaHref: "/dashboard/abonnement?reason=trial_ended",
      ctaColor: "bg-orange-500 hover:bg-orange-600",
      contact: false,
    },
    plan_expired: {
      headerColor: "bg-gradient-to-br from-amber-500 to-yellow-500",
      icon: "📅",
      title: "Votre abonnement a expiré",
      subtitle: "Renouvellement requis pour continuer",
      message: "Votre abonnement est arrivé à expiration. Vos données sont conservées. Renouvelez en quelques secondes pour rétablir l'accès immédiatement.",
      reasons: null,
      ctaLabel: "Renouveler mon abonnement",
      ctaHref: "/dashboard/abonnement",
      ctaColor: "bg-amber-500 hover:bg-amber-600",
      contact: false,
    },
    admin: {
      headerColor: "bg-red-600",
      icon: "🚫",
      title: "Compte suspendu",
      subtitle: "Accès temporairement désactivé",
      message: "L'accès à votre tableau de bord a été suspendu par l'équipe TableFlow.",
      reasons: [
        "Paiement en attente de régularisation",
        "Violation des conditions d'utilisation",
        "Demande de vérification de compte",
      ],
      ctaLabel: null,
      ctaHref: null,
      ctaColor: "",
      contact: true,
    },
  }[reason] ?? {
    headerColor: "bg-red-600",
    icon: "🚫",
    title: "Compte suspendu",
    subtitle: "Accès temporairement désactivé",
    message: "L'accès à votre tableau de bord a été suspendu.",
    reasons: null,
    ctaLabel: null,
    ctaHref: null,
    ctaColor: "",
    contact: true,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Header coloré */}
          <div className={`${content.headerColor} px-6 py-7 text-center`}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
              {content.icon}
            </div>
            <h1 className="text-white font-extrabold text-xl leading-tight">{content.title}</h1>
            <p className="text-white/70 text-sm mt-1">{content.subtitle}</p>
          </div>

          {/* Corps */}
          <div className="px-6 py-6 space-y-5">
            <p className="text-slate-600 text-sm leading-relaxed text-center">
              {content.message}
            </p>

            {/* Raisons (pour admin uniquement) */}
            {content.reasons && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Raisons possibles</p>
                {content.reasons.map((r) => (
                  <div key={r} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            )}

            {/* Plans pour trial_expired */}
            {reason === "trial_expired" && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Starter", price: "9 900", desc: "Commandes, QR, Analytics…", color: "border-blue-200 bg-blue-50" },
                  { label: "Pro", price: "24 900", desc: "Fidélité, Newsletter, Équipe…", color: "border-orange-200 bg-orange-50 ring-2 ring-orange-200" },
                ].map((p) => (
                  <div key={p.label} className={`border rounded-xl p-3 text-center ${p.color}`}>
                    <p className="font-extrabold text-slate-900 text-sm">{p.label}</p>
                    <p className="text-orange-600 font-bold text-xs mt-0.5">{p.price} FCFA<span className="text-slate-400 font-normal">/mois</span></p>
                    <p className="text-slate-500 text-[10px] mt-1 leading-tight">{p.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CTA abonnement */}
            {content.ctaLabel && content.ctaHref && (
              <Link
                href={content.ctaHref}
                className={`flex items-center justify-center gap-2 w-full py-3.5 ${content.ctaColor} text-white font-bold text-sm rounded-2xl transition-colors`}
              >
                💳 {content.ctaLabel}
              </Link>
            )}

            {/* Contact support */}
            {content.contact && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Pour régulariser votre situation, contactez-nous</p>
                <a
                  href="mailto:support@tableflow.app"
                  className="text-orange-600 font-bold text-sm hover:text-orange-700 transition-colors"
                >
                  support@tableflow.app
                </a>
              </div>
            )}
          </div>

          {/* Pied */}
          <div className="px-6 pb-6">
            <form action={async () => {
              "use server";
              await clearSessionCookie();
              redirect("/login");
            }}>
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl transition-colors"
              >
                Se déconnecter
              </button>
            </form>
            <p className="text-center text-xs text-slate-400 mt-3">
              Propulsé par <span className="font-semibold text-slate-500">TableFlow</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
