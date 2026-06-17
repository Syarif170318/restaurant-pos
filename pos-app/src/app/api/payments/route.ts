import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateReceiptNumber, orderInclude } from "@/lib/order";
import { calculateBill, getSettings } from "@/lib/settings";
import {
  earnLoyaltyPoints,
  findOrCreateCustomer,
  redeemLoyaltyPoints,
} from "@/lib/loyalty";
import { generateInvoiceNumber } from "@/lib/invoice";
import { sendEReceipt } from "@/lib/email";

type PaymentMethodType = "cash" | "card" | "digital_wallet";

async function authorizeManagerDiscount(
  user: { id: string; role: string; outletId: string },
  managerDiscount: number,
  managerPin?: string,
): Promise<boolean> {
  if (!managerDiscount || managerDiscount <= 0) return true;
  if (user.role === "admin" || user.role === "manager") return true;
  if (!managerPin) return false;

  const authorizer = await prisma.user.findFirst({
    where: {
      outletId: user.outletId,
      role: { in: ["admin", "manager"] },
      pinCode: managerPin,
      isActive: true,
    },
  });
  return !!authorizer;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const body = await request.json();
    const {
      orderId,
      paymentMethod = "cash",
      payments,
      amountReceived,
      itemIds,
      referenceNumber,
      customerPhone,
      customerName,
      redeemPoints,
      managerDiscount = 0,
      managerPin,
      emailReceipt,
    } = body as {
      orderId: string;
      paymentMethod?: PaymentMethodType;
      payments?: Array<{ method: PaymentMethodType; amount: number }>;
      amountReceived: number;
      itemIds?: string[];
      referenceNumber?: string;
      customerPhone?: string;
      customerName?: string;
      redeemPoints?: number;
      managerDiscount?: number;
      managerPin?: string;
      emailReceipt?: string;
    };

    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId: user.outletId },
      include: { table: true, items: true },
    });

    if (!order) return jsonError("Order not found", 404);
    if (order.status === "paid") return jsonError("Order already paid");
    if (!["confirmed", "preparing", "ready", "served"].includes(order.status)) {
      return jsonError("Order must be confirmed before payment");
    }

    if (managerDiscount > 0) {
      const authorized = await authorizeManagerDiscount(user, managerDiscount, managerPin);
      if (!authorized) {
        return jsonError("Manager authorization required for discount", 403);
      }
    }

    const settings = await getSettings();
    const isSplit = itemIds && itemIds.length > 0;

    let paySubtotal: number;
    let itemsToPay: string[];

    if (isSplit) {
      const unpaidItems = order.items.filter(
        (i) => itemIds.includes(i.id) && !i.isPaid,
      );
      if (unpaidItems.length === 0) return jsonError("No unpaid items selected");
      paySubtotal = unpaidItems.reduce((s, i) => s + i.subtotal, 0);
      itemsToPay = unpaidItems.map((i) => i.id);
    } else {
      const unpaidItems = order.items.filter((i) => !i.isPaid);
      if (unpaidItems.length === 0 && order.items.every((i) => i.isPaid)) {
        return jsonError("All items already paid");
      }
      paySubtotal = unpaidItems.length > 0
        ? unpaidItems.reduce((s, i) => s + i.subtotal, 0)
        : order.subtotal;
      itemsToPay = unpaidItems.map((i) => i.id);
    }

    let loyaltyDiscount = 0;
    let customerId = order.customerId;
    let totalDiscount = managerDiscount;

    if (customerPhone) {
      const customer = await findOrCreateCustomer(
        customerPhone,
        customerName ?? order.customerName ?? "Pelanggan",
        user.outletId,
      );
      customerId = customer.id;
      await prisma.order.update({
        where: { id: orderId },
        data: {
          customerId,
          customerPhone: customer.phone,
          customerName: customerName ?? customer.name,
        },
      });
    }

    if (redeemPoints && customerId && !isSplit) {
      loyaltyDiscount = await redeemLoyaltyPoints(customerId, orderId, redeemPoints);
      totalDiscount += loyaltyDiscount;
    }

    if (totalDiscount > 0 && !isSplit) {
      await prisma.order.update({
        where: { id: orderId },
        data: { discountAmount: order.discountAmount + totalDiscount },
      });
    }

    const effectiveDiscount = isSplit ? managerDiscount + loyaltyDiscount : totalDiscount;
    const bill = calculateBill(
      paySubtotal,
      effectiveDiscount,
      Number(settings.tax_percentage),
      Number(settings.service_charge_percentage),
    );
    const payAmount = bill.totalAmount;

    const paymentEntries: Array<{ method: PaymentMethodType; amount: number }> =
      payments && payments.length > 0
        ? payments
        : [{ method: paymentMethod, amount: payAmount }];

    const paymentsTotal = paymentEntries.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paymentsTotal - payAmount) > 0.01) {
      return jsonError("Payment amounts do not match total due");
    }

    const cashTotal = paymentEntries
      .filter((p) => p.method === "cash")
      .reduce((s, p) => s + p.amount, 0);

    if (cashTotal > 0 && amountReceived < payAmount) {
      return jsonError("Insufficient payment amount");
    }

    const changeAmount = cashTotal > 0 ? amountReceived - payAmount : 0;
    const receiptNumber = await generateReceiptNumber();

    for (const entry of paymentEntries) {
      const qrisRef = entry.method === "digital_wallet"
        ? referenceNumber ?? `QRIS-${Date.now()}`
        : referenceNumber;

      await prisma.payment.create({
        data: {
          orderId,
          paymentMethod: entry.method,
          amount: entry.amount,
          changeAmount: entry.method === "cash" ? Math.max(changeAmount, 0) : 0,
          referenceNumber: qrisRef,
          processedById: user.id,
          status: "completed",
        },
      });
    }

    await prisma.receipt.create({
      data: {
        orderId,
        receiptNumber,
        type: emailReceipt ? "email" : "print",
      },
    });

    if (itemsToPay.length > 0) {
      await prisma.orderItem.updateMany({
        where: { id: { in: itemsToPay } },
        data: { isPaid: true },
      });
    }

    const remainingUnpaid = await prisma.orderItem.count({
      where: { orderId, isPaid: false },
    });

    const fullyPaid = remainingUnpaid === 0;
    let invoiceNumber: string | undefined;

    if (fullyPaid) {
      invoiceNumber = await generateInvoiceNumber();
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "paid", paidAt: new Date(), invoiceNumber },
      });

      if (customerId) {
        await earnLoyaltyPoints(customerId, orderId, payAmount);
      }
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: "available" },
        });
      }

      if (emailReceipt) {
        const updatedOrder = await prisma.order.findFirst({
          where: { id: orderId },
          include: { items: { include: { menuItem: true } } },
        });
        const lines = updatedOrder?.items
          .map((i) => `${i.quantity}x ${i.menuItem.name} - Rp ${i.subtotal.toLocaleString("id-ID")}`)
          .join("\n") ?? "";
        await sendEReceipt(
          emailReceipt,
          `Receipt ${receiptNumber} / Invoice ${invoiceNumber}`,
          `Terima kasih!\n\nInvoice: ${invoiceNumber}\nReceipt: ${receiptNumber}\n\n${lines}\n\nTotal: Rp ${payAmount.toLocaleString("id-ID")}`,
        );
      }
    }

    await prisma.transactionLog.create({
      data: {
        orderId,
        action: fullyPaid ? "paid" : "partial_paid",
        details: JSON.stringify({
          paymentMethod: payments ? "split" : paymentMethod,
          payments: paymentEntries,
          amount: payAmount,
          changeAmount,
          receiptNumber,
          invoiceNumber,
          managerDiscount,
          itemIds: itemsToPay,
          isSplit,
        }),
        performedById: user.id,
      },
    });

    const updated = await prisma.order.findFirst({
      where: { id: orderId, outletId: user.outletId },
      include: { ...orderInclude, payments: true, receipts: true },
    });

    return jsonOk({
      order: updated,
      receiptNumber,
      invoiceNumber,
      changeAmount: Math.max(changeAmount, 0),
      paidAmount: payAmount,
      fullyPaid,
      qrisReference: referenceNumber,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
