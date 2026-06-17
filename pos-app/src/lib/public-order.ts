import { prisma } from "@/lib/prisma";
import { confirmOrder, generateOrderNumber, orderInclude, recalculateOrderTotals } from "@/lib/order";
import { findOrCreateCustomer } from "@/lib/loyalty";

export async function resolveOutlet(code: string) {
  return prisma.outlet.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  });
}

export async function getPublicMenu(outletId: string) {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isActive: true, isAvailable: true },
        include: { modifiers: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function getOutletTables(outletId: string) {
  return prisma.table.findMany({
    where: { outletId, isActive: true },
    orderBy: { tableNumber: "asc" },
  });
}

async function resolveCashierId(outletId: string) {
  const cashier = await prisma.user.findFirst({
    where: { outletId, role: "cashier", isActive: true },
  });
  if (cashier) return cashier.id;
  const manager = await prisma.user.findFirst({
    where: { outletId, role: "manager", isActive: true },
  });
  if (manager) return manager.id;
  const admin = await prisma.user.findFirst({ where: { role: "admin", isActive: true } });
  if (!admin) throw new Error("No staff available for outlet");
  return admin.id;
}

export async function createQrOrder(params: {
  outletId: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{ menuItemId: string; quantity: number; modifierIds?: string[]; notes?: string }>;
}) {
  const { outletId, tableNumber, customerName, customerPhone, items } = params;
  if (!items.length) throw new Error("Order must have items");

  let tableId: string | undefined;
  if (tableNumber) {
    const table = await prisma.table.findFirst({
      where: { outletId, tableNumber, isActive: true },
    });
    if (!table) throw new Error("Table not found");
    tableId = table.id;
  }

  const createdById = await resolveCashierId(outletId);
  let customerId: string | undefined;
  if (customerPhone && customerName) {
    const customer = await findOrCreateCustomer(customerPhone, customerName, outletId);
    customerId = customer.id;
  }

  const orderNumber = await generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      orderType: tableId ? "dine_in" : "takeaway",
      source: "qr_menu",
      outletId,
      tableId,
      customerId,
      customerName,
      customerPhone: customerPhone?.replace(/\D/g, ""),
      createdById,
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
            const selectedModifiers = menuItem.modifiers.filter((m) =>
              item.modifierIds?.includes(m.id),
            );
            const modifierTotal = selectedModifiers.reduce((s, m) => s + m.extraPrice, 0);
            const unitPrice = menuItem.price;
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

  await recalculateOrderTotals(order.id, outletId);
  const confirmed = await confirmOrder(order.id, createdById, outletId);

  await prisma.transactionLog.create({
    data: {
      orderId: order.id,
      action: "qr_order",
      details: JSON.stringify({ orderNumber, customerName, tableNumber }),
      performedById: createdById,
    },
  });

  return confirmed;
}
