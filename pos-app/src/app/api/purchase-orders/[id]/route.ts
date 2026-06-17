import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status: PurchaseOrderStatus };

    if (!status || !["sent", "received", "cancelled"].includes(status)) {
      return jsonError("Valid status required: sent, received, or cancelled");
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, outletId: user.outletId },
      include: { items: true },
    });
    if (!order) return jsonError("Purchase order not found", 404);

    if (status === "sent" && order.status !== "draft") {
      return jsonError("Only draft orders can be marked as sent");
    }
    if (status === "received" && order.status !== "sent") {
      return jsonError("Only sent orders can be marked as received");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          supplier: { select: { name: true } },
          items: {
            include: {
              ingredient: { select: { name: true, unit: true } },
            },
          },
        },
      });

      if (status === "received") {
        for (const item of order.items) {
          const stock = await tx.ingredientStock.findUnique({
            where: {
              ingredientId_outletId: {
                ingredientId: item.ingredientId,
                outletId: user.outletId,
              },
            },
          });

          if (stock) {
            await tx.ingredientStock.update({
              where: { id: stock.id },
              data: { currentStock: stock.currentStock + item.quantity, lastUpdated: new Date() },
            });
          } else {
            await tx.ingredientStock.create({
              data: {
                outletId: user.outletId,
                ingredientId: item.ingredientId,
                currentStock: item.quantity,
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              outletId: user.outletId,
              ingredientId: item.ingredientId,
              movementType: "in",
              quantity: item.quantity,
              referenceType: "purchase_order",
              referenceId: id,
              notes: `PO received`,
              supplierId: order.supplierId,
              createdById: user.id,
            },
          });
        }
      }

      return po;
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
