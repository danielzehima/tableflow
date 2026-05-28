function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

async function sendEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !opts.to) {
    const err = "Configuration manquante (EMAILJS_SERVICE_ID / TEMPLATE_ID / PUBLIC_KEY)";
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
      { publicKey, privateKey: privateKey ?? undefined }
    );
    console.log(`[EmailJS] Envoyé à "${opts.to}" — sujet: "${opts.subject}"`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[EmailJS] Erreur:", msg);
    return { ok: false, error: msg };
  }
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
