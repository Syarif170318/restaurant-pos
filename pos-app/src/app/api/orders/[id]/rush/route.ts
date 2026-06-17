import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function setRush(
  user: Awaited<ReturnType<typeof requireAuth>>,
  id: string,
  rush: boolean,
) {
  const order = await prisma.order.findFirst({
    where: { id, outletId: user.outletId },
  });
  if (!order) return jsonError("Order not found", 404);
  if (order.status === "paid" || order.status === "void") {
    return jsonError("Cannot mark a closed order as rush");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { isRush: rush },
  });

  await prisma.transactionLog.create({
    data: {
      orderId: id,
      action: rush ? "rush_on" : "rush_off",
      details: JSON.stringify({ rush }),
      performedById: user.id,
    },
  });

  return jsonOk(updated);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter", "kitchen"]);
    const { id } = await params;
    const { rush } = (await request.json()) as { rush?: boolean };

    if (typeof rush !== "boolean") return jsonError("rush boolean is required");
    return setRush(user, id, rush);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter", "kitchen"]);
    const { id } = await params;
    const { rush } = (await request.json()) as { rush?: boolean };

    if (typeof rush !== "boolean") return jsonError("rush boolean is required");
    return setRush(user, id, rush);
  } catch (error) {
    return handleApiError(error);
  }
}
