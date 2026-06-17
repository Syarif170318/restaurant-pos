import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { sendWhatsAppNotification } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "kitchen"]);
    const { id } = await params;
    const { status } = (await request.json()) as { status: "preparing" | "ready" | "served" };

    const item = await prisma.orderItem.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!item) return jsonError("Item not found", 404);
    if (item.order.outletId !== user.outletId) return jsonError("Item not found", 404);

    await prisma.orderItem.update({
      where: { id },
      data: { status },
    });

    const allItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    let orderStatus = item.order.status;
    if (status === "preparing") orderStatus = "preparing";
    if (allItems.every((i) => i.id === id ? status === "ready" : i.status === "ready")) {
      orderStatus = "ready";
    }
    if (allItems.every((i) => i.id === id ? status === "served" : i.status === "served")) {
      orderStatus = "served";
    }

    await prisma.order.update({
      where: { id: item.orderId },
      data: { status: orderStatus },
    });

    await prisma.transactionLog.create({
      data: {
        orderId: item.orderId,
        action: "kitchen_status",
        details: JSON.stringify({ itemId: id, status }),
        performedById: user.id,
      },
    });

    if (status === "ready" && orderStatus === "ready" && item.order.customerPhone) {
      await sendWhatsAppNotification(
        item.order.customerPhone,
        `Pesanan ${item.order.orderNumber} siap disajikan. Terima kasih!`,
      );
    }

    return jsonOk({ itemId: id, status, orderStatus });
  } catch (error) {
    return handleApiError(error);
  }
}
