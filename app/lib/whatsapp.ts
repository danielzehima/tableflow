function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  // Côte d'Ivoire par défaut si pas d'indicatif international
  if (digits.length === 10 && digits.startsWith("0")) return `+225${digits.slice(1)}`;
  return `+${digits}`;
}

export async function sendWhatsAppNotification(to: string, message: string): Promise<void> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token || !to) return;

  const normalized = toE164(to.trim());
  if (normalized.length < 8) return;

  const body = new URLSearchParams({
    token,
    to: normalized,
    body: message,
  });

  try {
    await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    // Notification failure must not block order creation
  }
}
