import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { orderInclude, recalculateOrderTotals } from "@/lib/order";
import { getEffectivePrice, isMenuAvailableNow } from "@/lib/menu-availability";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, outletId: user.outletId },
      include: orderInclude,
    });
    if (!order) return jsonError("Order not found", 404);
    return jsonOk(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const { id } = await params;
    const body = await request.json();
    const { menuItemId, quantity = 1, notes, modifierIds = [] } = body as {
      menuItemId: string;
      quantity?: number;
      notes?: string;
      modifierIds?: string[];
    };

    const order = await prisma.order.findFirst({
      where: { id, outletId: user.outletId },
    });
    if (!order) return jsonError("Order not found", 404);
    if (order.status !== "draft") return jsonError("Cannot modify confirmed order");

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { modifiers: true },
    });
    if (!menuItem || !menuItem.isAvailable) return jsonError("Menu item unavailable");
    if (!isMenuAvailableNow(menuItem.availableFrom, menuItem.availableTo)) {
      return jsonError(`Menu item not available at this time: ${menuItem.name}`);
    }

    const selectedModifiers = menuItem.modifiers.filter((m) => modifierIds.includes(m.id));
    const modifierTotal = selectedModifiers.reduce((s, m) => s + m.extraPrice, 0);
    const unitPrice = getEffectivePrice(
      menuItem.price,
      menuItem.takeawayPrice,
      order.orderType,
    );
    const subtotal = (unitPrice + modifierTotal) * quantity;

    await prisma.orderItem.create({
      data: {
        orderId: id,
        menuItemId,
        quantity,
        unitPrice,
        subtotal,
        notes,
        modifiers: {
          create: selectedModifiers.map((m) => ({
            modifierId: m.id,
            extraPrice: m.extraPrice,
          })),
        },
      },
    });

    const updated = await recalculateOrderTotals(id, user.outletId);

    await prisma.transactionLog.create({
      data: {
        orderId: id,
        action: "item_added",
        details: JSON.stringify({ menuItemId, quantity }),
        performedById: user.id,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
