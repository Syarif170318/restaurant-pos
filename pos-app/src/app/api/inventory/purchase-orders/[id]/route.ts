import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const { id } = await params;
    const { status } = (await request.json()) as { status?: PurchaseOrderStatus };

    if (!status || !["sent", "received"].includes(status)) {
      return jsonError("Status must be sent or received");
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id, outletId: user.outletId },
      include: { items: true, supplier: true },
    });
    if (!order) return jsonError("Purchase order not found", 404);

    if (status === "sent" && order.status !== "draft") {
      return jsonError("Only draft orders can be marked as sent");
    }
    if (status === "received" && order.status !== "sent") {
      return jsonError("Only sent orders can be marked as received");
    }

    if (status === "received") {
      await prisma.$transaction(async (tx) => {
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: "received" },
        });

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
              data: {
                currentStock: stock.currentStock + item.quantity,
                lastUpdated: new Date(),
              },
            });
          } else {
            await tx.ingredientStock.create({
              data: {
                ingredientId: item.ingredientId,
                outletId: user.outletId,
                currentStock: item.quantity,
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              ingredientId: item.ingredientId,
              outletId: user.outletId,
              movementType: "in",
              quantity: item.quantity,
              referenceType: "purchase_order",
              referenceId: id,
              supplierId: order.supplierId,
              createdById: user.id,
            },
          });
        }
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: "sent" },
      });
    }

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
