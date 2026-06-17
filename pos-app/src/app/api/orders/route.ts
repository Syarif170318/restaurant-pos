import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { generateOrderNumber, orderInclude, recalculateOrderTotals } from "@/lib/order";
import { getEffectivePrice, isMenuAvailableNow } from "@/lib/menu-availability";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const status = request.nextUrl.searchParams.get("status");
    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        outletId: user.outletId,
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const body = await request.json();
    const { orderType = "dine_in", tableId, items = [] } = body as {
      orderType?: "dine_in" | "takeaway";
      tableId?: string;
      items?: Array<{
        menuItemId: string;
        quantity: number;
        notes?: string;
        modifierIds?: string[];
      }>;
    };

    if (orderType === "dine_in" && tableId) {
      const table = await prisma.table.findFirst({
        where: { id: tableId, outletId: user.outletId, isActive: true },
      });
      if (!table) return jsonError("Table tidak tersedia untuk outlet Anda", 404);
    }

    const orderNumber = await generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType,
        tableId: orderType === "dine_in" ? tableId : null,
        outletId: user.outletId,
        createdById: user.id,
        items: {
          create: await Promise.all(
            items.map(async (item) => {
              const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                include: { modifiers: true },
              });
              if (!menuItem || !menuItem.isAvailable) {
                throw new Error(`Menu item unavailable: ${item.menuItemId}`);
              }
              if (!isMenuAvailableNow(menuItem.availableFrom, menuItem.availableTo)) {
                throw new Error(`Menu item not available at this time: ${menuItem.name}`);
              }

              const selectedModifiers = menuItem.modifiers.filter((m) =>
                item.modifierIds?.includes(m.id),
              );
              const modifierTotal = selectedModifiers.reduce((s, m) => s + m.extraPrice, 0);
              const unitPrice = getEffectivePrice(
                menuItem.price,
                menuItem.takeawayPrice,
                orderType,
              );
              const subtotal = (unitPrice + modifierTotal) * item.quantity;

              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice,
                subtotal,
                notes: item.notes,
                modifiers: {
                  create: selectedModifiers.map((m) => ({
                    modifierId: m.id,
                    extraPrice: m.extraPrice,
                  })),
                },
              };
            }),
          ),
        },
      },
      include: orderInclude,
    });

    const updated = await recalculateOrderTotals(order.id, user.outletId);

    await prisma.transactionLog.create({
      data: {
        orderId: order.id,
        action: "created",
        details: JSON.stringify({ orderNumber }),
        performedById: user.id,
      },
    });

    return jsonOk(updated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
