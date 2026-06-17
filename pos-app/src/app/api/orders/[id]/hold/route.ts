import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const { id } = await params;
    const { hold } = (await request.json()) as { hold?: boolean };

    if (typeof hold !== "boolean") return jsonError("hold boolean is required");

    const order = await prisma.order.findFirst({
      where: { id, outletId: user.outletId },
    });
    if (!order) return jsonError("Order not found", 404);
    if (order.status === "paid" || order.status === "void") {
      return jsonError("Cannot hold a closed order");
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { isHeld: hold },
    });

    await prisma.transactionLog.create({
      data: {
        orderId: id,
        action: hold ? "held" : "unheld",
        details: JSON.stringify({ hold }),
        performedById: user.id,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
