import { prisma } from "@/lib/prisma";
import { calculateBill, getSettings } from "@/lib/settings";
import { deductInventoryForOrder } from "@/lib/inventory";

export async function generateOrderNumber(): Promise<string> {
  const settings = await getSettings();
  const prefix = settings.order_prefix || "ORD";
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfDay } },
  });

  return `${prefix}-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}

export async function recalculateOrderTotals(orderId: string, outletId: string) {
  const settings = await getSettings();
  const order = await prisma.order.findFirst({
    where: { id: orderId, outletId },
    include: { items: true },
  });

  if (!order) throw new Error("Order not found");

  const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
  const bill = calculateBill(
    subtotal,
    order.discountAmount,
    Number(settings.tax_percentage),
    Number(settings.service_charge_percentage),
  );

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: bill.subtotal,
      taxAmount: bill.taxAmount,
      serviceCharge: bill.serviceCharge,
      totalAmount: bill.totalAmount,
    },
    include: {
      items: {
        include: {
          menuItem: true,
          modifiers: { include: { modifier: true } },
        },
      },
      table: true,
      createdBy: { select: { id: true, fullName: true, username: true } },
    },
  });
}

export async function confirmOrder(orderId: string, userId: string, outletId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, outletId },
    include: { items: true, table: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "draft") throw new Error("Order already confirmed");
  if (order.items.length === 0) throw new Error("Order has no items");

  await recalculateOrderTotals(orderId, outletId);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
    },
    include: {
      items: {
        include: {
          menuItem: true,
          modifiers: { include: { modifier: true } },
        },
      },
      table: true,
      createdBy: { select: { id: true, fullName: true, username: true } },
    },
  });

  if (order.tableId) {
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: "occupied" },
    });
  }

  await deductInventoryForOrder(orderId, outletId, userId);

  await prisma.transactionLog.create({
    data: {
      orderId,
      action: "confirmed",
      details: JSON.stringify({ orderNumber: order.orderNumber }),
      performedById: userId,
    },
  });

  return updated;
}

export async function generateReceiptNumber(): Promise<string> {
  const settings = await getSettings();
  const prefix = settings.receipt_prefix || "RCP";
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.receipt.count({
    where: { createdAt: { gte: startOfDay } },
  });

  return `${prefix}-${dateStr}-${String(count + 1).padStart(3, "0")}`;
}

export const orderInclude = {
  items: {
    include: {
      menuItem: true,
      modifiers: { include: { modifier: true } },
    },
  },
  table: true,
  createdBy: { select: { id: true, fullName: true, username: true } },
  payments: true,
  receipts: true,
} as const;
