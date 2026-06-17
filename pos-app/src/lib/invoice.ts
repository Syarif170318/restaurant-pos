import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function generateInvoiceNumber(): Promise<string> {
  const settings = await getSettings();
  const prefix = settings.invoice_prefix || "INV";
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const count = await prisma.order.count({
    where: { invoiceNumber: { not: null }, createdAt: { gte: startOfDay } },
  });
  return `${prefix}-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}
