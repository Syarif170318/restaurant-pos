import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const orders = await prisma.deliveryOrder.findMany({
      where: { outletId: user.outletId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
