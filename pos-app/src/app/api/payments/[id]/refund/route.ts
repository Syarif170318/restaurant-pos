import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const { reason } = (await request.json()) as { reason?: string };

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { order: { include: { table: true } } },
    });

    if (!payment) return jsonError("Payment not found", 404);
    if (payment.order.outletId !== user.outletId) {
      return jsonError("Payment not found", 404);
    }
    if (payment.status === "refunded") return jsonError("Already refunded");

    const paidAt = payment.paidAt;
    const hoursSince = (Date.now() - paidAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) return jsonError("Refund only allowed within 24 hours");

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: { status: "refunded" },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "served", paidAt: null },
      }),
      prisma.orderItem.updateMany({
        where: { orderId: payment.orderId },
        data: { isPaid: false },
      }),
      prisma.transactionLog.create({
        data: {
          orderId: payment.orderId,
          action: "refunded",
          details: JSON.stringify({ paymentId: id, reason, amount: payment.amount }),
          performedById: user.id,
        },
      }),
    ]);

    return jsonOk({ message: "Refund processed successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
