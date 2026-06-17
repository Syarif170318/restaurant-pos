import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const { id } = await params;
    const { reason } = (await request.json()) as { reason?: string };

    const order = await prisma.order.findFirst({
      where: { id, outletId: user.outletId },
      include: { table: true },
    });

    if (!order) return jsonError("Order not found", 404);
    if (order.status === "paid") return jsonError("Cannot void paid order. Use refund instead.");
    if (order.status === "void") return jsonError("Order already voided");

    await prisma.order.update({
      where: { id },
      data: { status: "void", voidReason: reason ?? "Voided by staff" },
    });

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: "available" },
      });
    }

    await prisma.transactionLog.create({
      data: {
        orderId: id,
        action: "voided",
        details: JSON.stringify({ reason }),
        performedById: user.id,
      },
    });

    return jsonOk({ message: "Order voided successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
