import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";
import { orderInclude } from "@/lib/order";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "kitchen", "cashier", "waiter"]);
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["confirmed", "preparing", "ready"] },
        outletId: user.outletId,
      },
      include: orderInclude,
      orderBy: { confirmedAt: "asc" },
    });
    return jsonOk(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
