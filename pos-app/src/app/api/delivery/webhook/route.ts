import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateOrderNumber, recalculateOrderTotals } from "@/lib/order";
import type { DeliveryPlatform } from "@/generated/prisma/client";

interface WebhookItem {
  name: string;
  qty: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platform,
      externalId,
      customerName,
      customerPhone,
      items,
      totalAmount,
      outletCode,
      createOrder = true,
    } = body as {
      platform?: DeliveryPlatform;
      externalId?: string;
      customerName?: string;
      customerPhone?: string;
      items?: WebhookItem[];
      totalAmount?: number;
      outletCode?: string;
      createOrder?: boolean;
    };

    if (!platform || !["gofood", "grabfood"].includes(platform)) {
      return jsonError("platform must be gofood or grabfood");
    }
    if (!externalId || !customerName || !items?.length || totalAmount == null) {
      return jsonError("externalId, customerName, items, and totalAmount are required");
    }
    if (!outletCode) {
      return jsonError("outletCode is required");
    }

    const outlet = await prisma.outlet.findFirst({
      where: { code: outletCode, isActive: true },
    });
    if (!outlet) return jsonError("Outlet not found", 404);

    const existing = await prisma.deliveryOrder.findUnique({
      where: { platform_externalId: { platform, externalId } },
    });
    if (existing) {
      return jsonOk({ deliveryOrder: existing, duplicate: true });
    }

    const systemUser = await prisma.user.findFirst({
      where: { outletId: outlet.id, role: { in: ["admin", "manager"] }, isActive: true },
    });
    if (!systemUser) {
      return jsonError("No active manager found for outlet", 500);
    }

    let linkedOrderId: string | null = null;

    if (createOrder) {
      const menuItems = await prisma.menuItem.findMany({
        where: { isActive: true, isAvailable: true },
        include: { category: true },
      });

      const orderItemsData: Array<{
        menuItemId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
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
        }
      }

      if (orderItemsData.length > 0) {
        const orderNumber = await generateOrderNumber();
        const order = await prisma.order.create({
          data: {
            orderNumber,
            orderType: "takeaway",
            source: "pos",
            outletId: outlet.id,
            createdById: systemUser.id,
            customerName,
            customerPhone: customerPhone ?? null,
            status: "draft",
            items: { create: orderItemsData },
          },
        });
        await recalculateOrderTotals(order.id, outlet.id);
        linkedOrderId = order.id;
      }
    }

    const deliveryOrder = await prisma.deliveryOrder.create({
      data: {
        outletId: outlet.id,
        platform,
        externalId,
        customerName,
        customerPhone: customerPhone ?? null,
        itemsJson: JSON.stringify(items),
        totalAmount,
        status: "pending",
        orderId: linkedOrderId,
      },
    });

    return jsonOk({ deliveryOrder, orderId: linkedOrderId }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
