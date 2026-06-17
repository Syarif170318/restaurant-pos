import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function getLoyaltySettings() {
  const settings = await getSettings();
  const pointsPerAmount = Number(settings.loyalty_points_per_amount ?? "1000");
  const redeemValue = Number(settings.loyalty_redeem_value ?? "100");
  return { pointsPerAmount, redeemValue };
}

export function calculateEarnedPoints(amount: number, pointsPerAmount: number): number {
  if (pointsPerAmount <= 0) return 0;
  return Math.floor(amount / pointsPerAmount);
}

export function calculateRedeemDiscount(points: number, redeemValue: number): number {
  return points * redeemValue;
}

export async function findOrCreateCustomer(
  phone: string,
  name: string,
  outletId: string,
) {
  const normalized = phone.replace(/\D/g, "");
  const existing = await prisma.customer.findUnique({ where: { phone: normalized } });
  if (existing) {
    if (!existing.outletId) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: { outletId },
      });
    }
    return existing;
  }
  return prisma.customer.create({
    data: { phone: normalized, name, outletId },
  });
}

export async function earnLoyaltyPoints(
  customerId: string,
  orderId: string,
  paidAmount: number,
) {
  const { pointsPerAmount } = await getLoyaltySettings();
  const points = calculateEarnedPoints(paidAmount, pointsPerAmount);
  if (points <= 0) return null;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { increment: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        customerId,
        orderId,
        type: "earn",
        points,
        notes: `Earned from payment Rp ${paidAmount}`,
      },
    }),
  ]);

  return points;
}

export async function redeemLoyaltyPoints(
  customerId: string,
  orderId: string,
  pointsToRedeem: number,
) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");
  if (pointsToRedeem <= 0) throw new Error("Invalid redeem points");
  if (customer.loyaltyPoints < pointsToRedeem) throw new Error("Insufficient loyalty points");

  const { redeemValue } = await getLoyaltySettings();
  const discount = calculateRedeemDiscount(pointsToRedeem, redeemValue);

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: { decrement: pointsToRedeem } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        customerId,
        orderId,
        type: "redeem",
        points: pointsToRedeem,
        notes: `Redeemed for Rp ${discount} discount`,
      },
    }),
  ]);

  return discount;
}
