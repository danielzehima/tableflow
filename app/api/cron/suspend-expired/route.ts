import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase-server";
import {
  sendTrialWarningEmail,
  sendTrialExpiredEmail,
  sendPlanExpiredEmail,
} from "../../../lib/email";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tableflow-gilt.vercel.app";
const TRIAL_DAYS = 14;

/** Renvoie l'email du propriétaire d'un restaurant */
async function getOwnerEmail(restaurantId: string): Promise<{ email: string; name: string } | null> {
  const { data } = await supabase
    .from("restaurant_users")
    .select("email, name")
    .eq("restaurant_id", restaurantId)
    .eq("role", "owner")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function GET(req: Request) {
  // ── Sécurité : Bearer token requis ────────────────────────────────────────
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now     = new Date();
  const nowIso  = now.toISOString();

  // ── Dates clés pour le calcul des essais ──────────────────────────────────
  const trialExpiredBefore = new Date(now);
  trialExpiredBefore.setDate(trialExpiredBefore.getDate() - TRIAL_DAYS);

  const warningBefore = new Date(now);
  warningBefore.setDate(warningBefore.getDate() - (TRIAL_DAYS - 2)); // J-2

  const results = {
    trials_suspended:    0,
    plans_suspended:     0,
    warnings_sent:       0,
    emails_sent:         0,
    errors:              [] as string[],
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 1. AVERTISSEMENT J-2 : essai se termine dans 2 jours
  // ══════════════════════════════════════════════════════════════════════════
  const { data: warnList } = await supabase
    .from("restaurants")
    .select("id, name, created_at")
    .eq("plan", "free")
    .eq("status", "active")
    .eq("trial_warning_sent", false)
    // created_at entre J-13 et J-12 (c'est-à-dire il reste exactement 1-2 jours)
    .lt("created_at", warningBefore.toISOString())
    .gt("created_at", trialExpiredBefore.toISOString()); // pas encore expiré

  for (const r of warnList ?? []) {
    const trialEndsAt = new Date(r.created_at);
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
    const daysLeft = Math.max(0, Math.floor((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const owner = await getOwnerEmail(r.id);
    if (owner?.email) {
      const { ok } = await sendTrialWarningEmail({
        to: owner.email,
        restaurantName: r.name,
        daysLeft,
        appUrl: APP_URL,
      });
      if (ok) results.emails_sent++;
      else results.errors.push(`Warning email failed for ${r.id}`);
    }

    // Marquer comme averti même si l'email échoue pour éviter les doublons
    await supabase
      .from("restaurants")
      .update({ trial_warning_sent: true })
      .eq("id", r.id);

    results.warnings_sent++;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SUSPENSION essai expiré (plan=free, actif, créé il y a > 14 jours)
  // ══════════════════════════════════════════════════════════════════════════
  const { data: expiredTrials } = await supabase
    .from("restaurants")
    .select("id, name, created_at")
    .eq("plan", "free")
    .eq("status", "active")
    .lt("created_at", trialExpiredBefore.toISOString());

  for (const r of expiredTrials ?? []) {
    // Suspendre
    await supabase
      .from("restaurants")
      .update({
        status: "suspended",
        suspension_reason: "trial_expired",
      })
      .eq("id", r.id);

    results.trials_suspended++;

    // Email si pas encore envoyé
    const { data: flags } = await supabase
      .from("restaurants")
      .select("expiry_email_sent")
      .eq("id", r.id)
      .single();

    if (!flags?.expiry_email_sent) {
      const owner = await getOwnerEmail(r.id);
      if (owner?.email) {
        const { ok } = await sendTrialExpiredEmail({
          to: owner.email,
          restaurantName: r.name,
          appUrl: APP_URL,
        });
        if (ok) results.emails_sent++;
        else results.errors.push(`Expiry email failed for ${r.id}`);
      }

      await supabase
        .from("restaurants")
        .update({ expiry_email_sent: true })
        .eq("id", r.id);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SUSPENSION plans payants expirés (déjà existant + email ajouté)
  // ══════════════════════════════════════════════════════════════════════════
  const { data: expiredPlans } = await supabase
    .from("restaurants")
    .select("id, name, plan")
    .eq("status", "active")
    .neq("plan", "free")
    .not("plan_expires_at", "is", null)
    .lt("plan_expires_at", nowIso);

  for (const r of expiredPlans ?? []) {
    await supabase
      .from("restaurants")
      .update({
        status: "suspended",
        suspension_reason: "plan_expired",
      })
      .eq("id", r.id);

    results.plans_suspended++;

    const { data: flags } = await supabase
      .from("restaurants")
      .select("expiry_email_sent")
      .eq("id", r.id)
      .single();

    if (!flags?.expiry_email_sent) {
      const owner = await getOwnerEmail(r.id);
      if (owner?.email) {
        const planLabel = r.plan === "pro" ? "Pro" : "Starter";
        const { ok } = await sendPlanExpiredEmail({
          to: owner.email,
          restaurantName: r.name,
          planLabel,
          appUrl: APP_URL,
        });
        if (ok) results.emails_sent++;
        else results.errors.push(`Plan expiry email failed for ${r.id}`);
      }

      await supabase
        .from("restaurants")
        .update({ expiry_email_sent: true })
        .eq("id", r.id);
    }
  }

  return NextResponse.json({
    ok: true,
    checked_at: nowIso,
    ...results,
  });
}
