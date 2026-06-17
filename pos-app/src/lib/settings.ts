import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  tax_percentage: "10",
  service_charge_percentage: "5",
  receipt_header: "Restaurant POS",
  receipt_footer: "Terima kasih atas kunjungan Anda!",
  currency: "IDR",
  invoice_prefix: "INV",
  receipt_prefix: "RCP",
  order_prefix: "ORD",
  loyalty_points_per_amount: "1000",
  loyalty_redeem_value: "100",
};

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? DEFAULTS[key] ?? "";
}

export async function getSettings() {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

export function calculateBill(
  subtotal: number,
  discountAmount = 0,
  taxPercentage = 10,
  serviceChargePercentage = 5,
) {
  const taxable = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxable * (taxPercentage / 100));
  const serviceCharge = Math.round(taxable * (serviceChargePercentage / 100));
  const totalAmount = taxable + taxAmount + serviceCharge;

  return { subtotal, discountAmount, taxAmount, serviceCharge, totalAmount };
}
