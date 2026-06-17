export async function sendEReceipt(to: string, subject: string, body: string) {
  // Dev/staging: log to console. Production: wire SMTP (Nodemailer/Resend).
  console.log(`[E-RECEIPT] To: ${to}\nSubject: ${subject}\n---\n${body}`);
  return { sent: true, mode: "log" as const };
}
