import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const { orderId, tableIds } = (await request.json()) as {
      orderId?: string;
      tableIds?: string[];
    };

    if (!orderId || !tableIds?.length) {
      return jsonError("Order ID and table IDs are required");
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, outletId: user.outletId },
    });
    if (!order) return jsonError("Order not found", 404);
    if (order.status === "paid" || order.status === "void") {
      return jsonError("Cannot merge tables for a closed order");
    }

    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds }, outletId: user.outletId, isActive: true },
    });
    if (tables.length !== tableIds.length) {
      return jsonError("One or more tables not found");
    }

    const primaryTableId = tableIds[0];
    const updated = await prisma.$transaction(async (tx) => {
      await tx.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: "occupied" },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          tableId: primaryTableId,
          mergedTableIds: JSON.stringify(tableIds),
        },
      });
    });

    await prisma.transactionLog.create({
      data: {
        orderId,
        action: "tables_merged",
        details: JSON.stringify({ tableIds }),
        performedById: user.id,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
