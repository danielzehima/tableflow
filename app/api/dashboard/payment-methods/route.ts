import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import { getSession } from "../../../lib/auth-server";
import { PROVIDERS, maskSecret, type ProviderId } from "../../../lib/payment-providers";

// ── GET : retourne les méthodes du restaurant (clés masquées) ─────────────────
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await supabase
    .from("restaurant_payment_methods")
    .select("id, provider, enabled, merchant_id, api_key, api_secret, webhook_secret, extra_config, updated_at")
    .eq("restaurant_id", session.restaurantId)
    .order("provider");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si aucune ligne n'existe encore (vieux compte avant migration), on retourne des défauts
  const rows = data ?? [];
  const result = PROVIDERS.map((providerDef) => {
    const row = rows.find((r) => r.provider === providerDef.id);
    return {
      provider:         providerDef.id,
      enabled:          row?.enabled ?? false,
      // Clés masquées pour le frontend
      merchant_id:      maskSecret(row?.merchant_id ?? null),
      api_key:          maskSecret(row?.api_key ?? null),
      api_secret:       maskSecret(row?.api_secret ?? null),
      webhook_secret:   maskSecret(row?.webhook_secret ?? null),
      extra_config:     row?.extra_config ?? {},
      // Indicateurs booléens "est-ce configuré ?"
      has_merchant_id:  !!row?.merchant_id,
      has_api_key:      !!row?.api_key,
      has_api_secret:   !!row?.api_secret,
      has_webhook_secret: !!row?.webhook_secret,
      updated_at:       row?.updated_at ?? null,
    };
  });

  return NextResponse.json(result);
}

// ── PUT : sauvegarde la config d'un opérateur ─────────────────────────────────
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (session.role !== "owner" && session.role !== "manager") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json() as {
    provider: ProviderId;
    enabled?: boolean;
    merchant_id?: string;
    api_key?: string;
    api_secret?: string;
    webhook_secret?: string;
    extra_config?: Record<string, string>;
  };

  const { provider, enabled, merchant_id, api_key, api_secret, webhook_secret, extra_config } = body;

  // Valider le provider
  if (!PROVIDERS.find((p) => p.id === provider)) {
    return NextResponse.json({ error: "Opérateur invalide" }, { status: 400 });
  }

  // Construire le payload de mise à jour
  // Ne mettre à jour les clés que si elles sont fournies et ne contiennent pas de masque
  const updates: Record<string, unknown> = {
    restaurant_id: session.restaurantId,
    provider,
    updated_at: new Date().toISOString(),
  };

  if (typeof enabled === "boolean") updates.enabled = enabled;

  function shouldUpdate(val: string | undefined): boolean {
    return !!val && val.trim().length > 0 && !val.includes("••");
  }

  if (shouldUpdate(merchant_id))    updates.merchant_id    = merchant_id!.trim();
  if (shouldUpdate(api_key))        updates.api_key        = api_key!.trim();
  if (shouldUpdate(api_secret))     updates.api_secret     = api_secret!.trim();
  if (shouldUpdate(webhook_secret)) updates.webhook_secret = webhook_secret!.trim();
  if (extra_config)                 updates.extra_config   = extra_config;

  // UPSERT : crée la ligne si elle n'existe pas encore
  const { error } = await supabase
    .from("restaurant_payment_methods")
    .upsert(updates, { onConflict: "restaurant_id,provider" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// ── DELETE d'un champ sensible (effacer une clé) ──────────────────────────────
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut supprimer des clés" }, { status: 403 });
  }

  const body = await req.json() as { provider: ProviderId; field: string };
  const { provider, field } = body;

  const allowedFields = ["merchant_id", "api_key", "api_secret", "webhook_secret"];
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: "Champ invalide" }, { status: 400 });
  }

  const { error } = await supabase
    .from("restaurant_payment_methods")
    .update({ [field]: null, updated_at: new Date().toISOString() })
    .eq("restaurant_id", session.restaurantId)
    .eq("provider", provider);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
