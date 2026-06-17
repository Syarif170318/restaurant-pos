export async function sendWhatsAppNotification(phone: string, message: string) {
  // Stub: log for dev. Production: WhatsApp Business API.
  console.log(`[WHATSAPP] To: ${phone}\n${message}`);
  return { sent: true, mode: "log" as const };
}
