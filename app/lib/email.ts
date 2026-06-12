function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Couche email multi-fournisseurs
//   1. Resend (REST API, recommandé pour l'envoi en masse) si RESEND_API_KEY valide
//   2. EmailJS (secours) si EMAILJS_PRIVATE_KEY présent
// ─────────────────────────────────────────────────────────────────────────────

/** Une clé est-elle réellement configurée (et pas un placeholder) ? */
function isConfigured(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v) return false;
  // Placeholders courants à ignorer
  const placeholders = ["re_votre_cle_ici", "votre_cle", "your_key", "xxx", "changeme"];
  return !placeholders.some((p) => v.toLowerCase().includes(p));
}

/** Convertit un message texte en HTML simple (sauts de ligne préservés) */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">${escaped}</div>`;
}

// ── Fournisseur 1 : Resend (REST, sans dépendance) ───────────────────────────
async function sendViaResend(opts: {
  to: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM?.trim() || "TableFlow <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.message,
        html: textToHtml(opts.message),
      }),
    });

    if (res.ok) {
      console.log(`[Resend] Envoyé à "${opts.to}" — sujet: "${opts.subject}"`);
      return { ok: true };
    }

    const data = await res.json().catch(() => ({}));
    const msg = (data as { message?: string }).message ?? `HTTP ${res.status}`;
    console.error("[Resend] Erreur:", msg);
    return { ok: false, error: `Resend : ${msg}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Erreur réseau:", msg);
    return { ok: false, error: `Resend : ${msg}` };
  }
}

// ── Fournisseur 2 : EmailJS (secours) ────────────────────────────────────────
async function sendViaEmailJS(opts: {
  to: string;
  toName?: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  // La clé privée est OBLIGATOIRE côté serveur — sinon EmailJS rejette l'appel
  if (!serviceId || !templateId || !publicKey || !privateKey) {
    const err = "EmailJS : configuration serveur incomplète (EMAILJS_PRIVATE_KEY requise côté serveur)";
    console.error("[EmailJS]", err);
    return { ok: false, error: err };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const emailjs = require("@emailjs/nodejs");
    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: opts.to,
        to_name: opts.toName || "Client",
        subject: opts.subject,
        message: opts.message,
      },
      { publicKey, privateKey }
    );
    console.log(`[EmailJS] Envoyé à "${opts.to}" — sujet: "${opts.subject}"`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[EmailJS] Erreur:", msg);
    return { ok: false, error: `EmailJS : ${msg}` };
  }
}

// ── Point d'entrée unique ─────────────────────────────────────────────────────
async function sendEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!opts.to || !opts.to.trim()) {
    return { ok: false, error: "Adresse email destinataire manquante" };
  }

  const hasResend = isConfigured(process.env.RESEND_API_KEY);
  const hasEmailJS = isConfigured(process.env.EMAILJS_PRIVATE_KEY);

  // Aucun fournisseur configuré → erreur explicite et actionnable
  if (!hasResend && !hasEmailJS) {
    const err =
      "Aucun service email configuré. Renseignez RESEND_API_KEY (recommandé) " +
      "ou EMAILJS_PRIVATE_KEY dans vos variables d'environnement.";
    console.error("[Email]", err);
    return { ok: false, error: err };
  }

  // 1. Resend en priorité
  if (hasResend) {
    const result = await sendViaResend(opts);
    if (result.ok) return result;
    // Si Resend échoue mais EmailJS dispo → on tente le secours
    if (hasEmailJS) {
      const fallback = await sendViaEmailJS(opts);
      if (fallback.ok) return fallback;
      return { ok: false, error: `${result.error} | secours ${fallback.error}` };
    }
    return result;
  }

  // 2. EmailJS seul
  return sendViaEmailJS(opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Emails TableFlow → gérants de restaurant (cycle de vie abonnement)
// ─────────────────────────────────────────────────────────────────────────────

/** Email J-2 : avertissement avant fin d'essai */
export async function sendTrialWarningEmail(opts: {
  to: string;
  restaurantName: string;
  daysLeft: number;
  appUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, restaurantName, daysLeft, appUrl } = opts;
  return sendEmail({
    to,
    toName: restaurantName,
    subject: `⚠️ Votre essai TableFlow se termine dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
    message:
      `Bonjour,\n\n` +
      `Votre période d'essai gratuit pour "${restaurantName}" sur TableFlow se termine dans ` +
      `${daysLeft} jour${daysLeft > 1 ? "s" : ""}.\n\n` +
      `Pour continuer à utiliser le tableau de bord, les commandes en ligne, les réservations\n` +
      `et toutes les fonctionnalités sans interruption, choisissez un plan dès maintenant.\n\n` +
      `👉 Choisir un plan : ${appUrl}/dashboard/abonnement\n\n` +
      `• Starter  : 9 900 FCFA/mois — Réservations illimitées, Commandes en ligne, Analytics…\n` +
      `• Pro      : 24 900 FCFA/mois — Tout Starter + Fidélité, Newsletter, Équipe…\n\n` +
      `Passez à l'action avant la fin de votre essai pour ne rien manquer !\n\n` +
      `L'équipe TableFlow`,
  });
}

/** Email J0 : essai expiré, compte bloqué */
export async function sendTrialExpiredEmail(opts: {
  to: string;
  restaurantName: string;
  appUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, restaurantName, appUrl } = opts;
  return sendEmail({
    to,
    toName: restaurantName,
    subject: `🔒 Votre essai TableFlow est terminé — Choisissez un plan`,
    message:
      `Bonjour,\n\n` +
      `La période d'essai gratuit de 14 jours pour "${restaurantName}" est maintenant terminée.\n\n` +
      `Votre accès au tableau de bord a été suspendu.\n\n` +
      `Pour réactiver immédiatement votre compte et retrouver toutes vos données,\n` +
      `souscrivez à un plan en moins de 2 minutes :\n\n` +
      `👉 Choisir un plan : ${appUrl}/dashboard/abonnement\n\n` +
      `• Starter  : 9 900 FCFA/mois\n` +
      `• Pro      : 24 900 FCFA/mois\n\n` +
      `Vos données sont conservées. Dès le paiement validé, votre accès est rétabli instantanément.\n\n` +
      `Une question ? Répondez à cet email ou écrivez à support@tableflow.app\n\n` +
      `L'équipe TableFlow`,
  });
}

/** Email J0 : abonnement payant expiré, compte bloqué */
export async function sendPlanExpiredEmail(opts: {
  to: string;
  restaurantName: string;
  planLabel: string;
  appUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, restaurantName, planLabel, appUrl } = opts;
  return sendEmail({
    to,
    toName: restaurantName,
    subject: `⏰ Votre abonnement ${planLabel} TableFlow a expiré`,
    message:
      `Bonjour,\n\n` +
      `Votre abonnement "${planLabel}" pour "${restaurantName}" sur TableFlow est arrivé à expiration.\n\n` +
      `Votre accès au tableau de bord a été suspendu.\n\n` +
      `Pour renouveler et retrouver un accès complet :\n\n` +
      `👉 Renouveler mon abonnement : ${appUrl}/dashboard/abonnement\n\n` +
      `Toutes vos données sont conservées. La réactivation est immédiate après paiement.\n\n` +
      `L'équipe TableFlow`,
  });
}

export async function sendNewsletterEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  bodyText: string;
  restaurantName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const message =
    `${opts.bodyText}\n\n` +
    `---\n` +
    `Vous recevez cet email car vous avez commandé chez ${opts.restaurantName}.\n` +
    `Propulsé par TableFlow.`;

  return sendEmail({
    to: opts.to,
    toName: opts.toName,
    subject: opts.subject,
    message,
  });
}

export async function sendReservationConfirmation(opts: {
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
}): Promise<void> {
  const { customerEmail, customerPhone, customerName, restaurantName, date, time, guests } = opts;

  const whatsappMsg =
    `📅 *Demande de réservation reçue — ${restaurantName}*\n\n` +
    `Bonjour ${customerName},\n\n` +
    `Votre demande a bien été enregistrée :\n` +
    `📅 ${fmtDate(date)}\n🕐 ${time}\n👥 ${guests} personne${guests > 1 ? "s" : ""}\n\n` +
    `Nous vous confirmerons dans les plus brefs délais.`;

  const emailMessage =
    `Bonjour ${customerName},\n\n` +
    `Votre demande de réservation chez ${restaurantName} a bien été enregistrée.\n\n` +
    `📅 Date : ${fmtDate(date)}\n` +
    `🕐 Heure : ${time}\n` +
    `👥 Personnes : ${guests} personne${guests > 1 ? "s" : ""}\n\n` +
    `Vous recevrez une confirmation dès que le restaurant aura validé votre demande.`;

  await Promise.allSettled([
    sendWhatsApp(customerPhone, whatsappMsg),
    customerEmail
      ? sendEmail({
          to: customerEmail,
          toName: customerName,
          subject: `Demande reçue — ${restaurantName}`,
          message: emailMessage,
        })
      : Promise.resolve(),
  ]);
}

export async function sendReservationStatusUpdate(opts: {
  customerEmail: string | null;
  customerPhone: string;
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  status: string;
}): Promise<void> {
  const { customerEmail, customerPhone, customerName, restaurantName, date, time, guests, status } = opts;
  const isConfirmed = status === "Confirmée";
  const isCancelled = status === "Annulée";
  if (!isConfirmed && !isCancelled) return;

  const emoji = isConfirmed ? "✅" : "❌";
  const label = isConfirmed ? "confirmée" : "annulée";
  const outro = isConfirmed
    ? `Nous vous attendons avec plaisir ! En cas d'empêchement, n'hésitez pas à nous prévenir.`
    : `Nous sommes désolés pour la gêne occasionnée. N'hésitez pas à réserver une nouvelle date.`;

  const whatsappMsg =
    `${emoji} *Réservation ${label} — ${restaurantName}*\n\n` +
    `Bonjour ${customerName},\n\n` +
    `Votre réservation du ${fmtDate(date)} à ${time} pour ${guests} personne${guests > 1 ? "s" : ""} est *${label}*.\n\n` +
    (isConfirmed ? `Nous vous attendons !` : `Merci de votre compréhension.`);

  const emailMessage =
    `Bonjour ${customerName},\n\n` +
    `Votre réservation chez ${restaurantName} est ${label}.\n\n` +
    `📅 Date : ${fmtDate(date)}\n` +
    `🕐 Heure : ${time}\n` +
    `👥 Personnes : ${guests} personne${guests > 1 ? "s" : ""}\n\n` +
    `${outro}`;

  await Promise.allSettled([
    sendWhatsApp(customerPhone, whatsappMsg),
    customerEmail
      ? sendEmail({
          to: customerEmail,
          toName: customerName,
          subject: `${emoji} Réservation ${label} — ${restaurantName}`,
          message: emailMessage,
        })
      : Promise.resolve(),
  ]);
}

export async function sendNewReservationAlert(opts: {
  restaurantWhatsapp: string;
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  message?: string;
}): Promise<void> {
  const { restaurantWhatsapp, restaurantName, customerName, customerPhone, date, time, guests, message } = opts;
  if (!restaurantWhatsapp) return;
  const msg =
    `📅 *Nouvelle réservation — ${restaurantName}*\n\n` +
    `👤 ${customerName}\n📱 ${customerPhone}\n` +
    `📅 ${fmtDate(date)}\n🕐 ${time}\n👥 ${guests} personne${guests > 1 ? "s" : ""}` +
    (message ? `\n💬 ${message}` : "");
  await sendWhatsApp(restaurantWhatsapp, msg);
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  if (!instanceId || !token || !to) return;
  const digits = to.replace(/\D/g, "");
  const normalized = to.trim().startsWith("+") ? `+${digits}` : digits.length === 10 && digits.startsWith("0") ? `+225${digits.slice(1)}` : `+${digits}`;
  if (normalized.length < 8) return;
  try {
    await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token, to: normalized, body }).toString(),
    });
  } catch { /* non-bloquant */ }
}
