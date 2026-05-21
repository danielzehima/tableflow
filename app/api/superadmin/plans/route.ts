import { NextResponse } from "next/server";
import { verifyAdminApi } from "../../../lib/admin-auth";
import { supabase } from "../../../lib/supabase-server";

const DEFAULT_PLANS = [
  {
    plan: "free", label: "Gratuit", price: 0, currency: "FCFA",
    description: "Pour découvrir TableFlow sans engagement",
    features: ["Page publique", "Menu en ligne", "5 réservations / mois"],
    highlight: false, badge: null, cta_text: "Commencer gratuitement",
    cta_href: "/inscription", sort_order: 0,
    updated_at: new Date().toISOString(),
  },
  {
    plan: "starter", label: "Starter", price: 9900, currency: "FCFA",
    description: "Pour démarrer votre présence en ligne",
    features: ["Tout Gratuit", "Réservations illimitées", "Commandes en ligne", "Stats basiques", "Support par email"],
    highlight: false, badge: null, cta_text: "Commencer",
    cta_href: "/inscription", sort_order: 1,
    updated_at: new Date().toISOString(),
  },
  {
    plan: "pro", label: "Pro", price: 24900, currency: "FCFA",
    description: "La solution complète pour les restaurants actifs",
    features: ["Tout Starter", "Bannière personnalisée", "Support prioritaire", "Stats avancées", "Notifications SMS / email"],
    highlight: true, badge: "Le plus populaire", cta_text: "Démarrer l'essai gratuit",
    cta_href: "/inscription", sort_order: 2,
    updated_at: new Date().toISOString(),
  },
];

export async function GET() {
  const denied = await verifyAdminApi();
  if (denied) return denied;

  // Tentative de lecture en base
  const { data, error } = await supabase
    .from("plan_settings")
    .select("*")
    .order("sort_order");

  // Si la table existe et contient des données → on les retourne
  if (!error && data && data.length > 0) {
    return NextResponse.json(data);
  }

  // Si la table existe mais est vide → on insère les defaults et on les retourne
  if (!error && (!data || data.length === 0)) {
    await supabase.from("plan_settings").insert(DEFAULT_PLANS);
    return NextResponse.json(DEFAULT_PLANS);
  }

  // Si la table n'existe pas ou toute autre erreur DB → on retourne les defaults
  // sans erreur pour que la page s'affiche toujours
  return NextResponse.json(DEFAULT_PLANS);
}
