import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { confirmOrder, generateOrderNumber, recalculateOrderTotals } from "@/lib/order";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const { id } = await params;

    const deliveryOrder = await prisma.deliveryOrder.findFirst({
      where: { id, outletId: user.outletId },
    });
    if (!deliveryOrder) return jsonError("Delivery order not found", 404);
    if (deliveryOrder.status !== "pending") {
      return jsonError("Delivery order already processed");
    }

    let orderId = deliveryOrder.orderId;
    const items = JSON.parse(deliveryOrder.itemsJson) as Array<{
      name: string;
      qty: number;
      price: number;
    }>;

    if (!orderId) {
      const menuItems = await prisma.menuItem.findMany({
        where: { isActive: true },
      });

      const orderItemsData: Array<{
        menuItemId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        notes?: string;
      }> = [];

      for (const item of items) {
        const match = menuItems.find(
          (m) => m.name.toLowerCase() === item.name.toLowerCase(),
        );
        if (match) {
          orderItemsData.push({
            menuItemId: match.id,
            quantity: item.qty,
            unitPrice: item.price,
            subtotal: item.price * item.qty,
          });
        } else {
          const fallback = menuItems[0];
          if (fallback) {
            orderItemsData.push({
              menuItemId: fallback.id,
              quantity: item.qty,
              unitPrice: item.price,
              subtotal: item.price * item.qty,
              notes: `[${deliveryOrder.platform}] ${item.name}`,
            });
          }
        }
      }

      if (orderItemsData.length === 0) {
        return jsonError("No menu items available to create order");
      }

      const orderNumber = await generateOrderNumber();
      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderType: "takeaway",
          source: "pos",
          outletId: user.outletId,
          createdById: user.id,
          customerName: deliveryOrder.customerName,
          customerPhone: deliveryOrder.customerPhone,
          status: "draft",
          items: { create: orderItemsData },
        },
      });
      await recalculateOrderTotals(order.id, user.outletId);
      orderId = order.id;
    }

    const confirmed = await confirmOrder(orderId, user.id, user.outletId);

    const updated = await prisma.deliveryOrder.update({
      where: { id },
      data: { status: "accepted", orderId },
    });

    return jsonOk({ deliveryOrder: updated, order: confirmed });
  } catch (error) {
    return handleApiError(error);
  }
}
