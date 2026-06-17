import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { recalculateOrderTotals } from "@/lib/order";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const { id, itemId } = await params;

    const order = await prisma.order.findFirst({ where: { id, outletId: user.outletId } });
    if (!order) return jsonError("Order not found", 404);
    if (order.status !== "draft") return jsonError("Cannot modify confirmed order");

    await prisma.orderItem.delete({ where: { id: itemId } });
    const updated = await recalculateOrderTotals(id, user.outletId);

    await prisma.transactionLog.create({
      data: {
        orderId: id,
        action: "item_removed",
        details: JSON.stringify({ itemId }),
        performedById: user.id,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
