import { prisma } from "@/lib/prisma";

export async function deductInventoryForOrder(
  orderId: string,
  outletId: string,
  userId: string,
) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    include: {
      menuItem: {
        include: {
          recipes: {
            include: { ingredient: true },
          },
        },
      },
    },
  });

  for (const orderItem of items) {
    for (const recipe of orderItem.menuItem.recipes) {
      const deductQty = recipe.quantityNeeded * orderItem.quantity;
      const stock = await prisma.ingredientStock.findUnique({
        where: {
          ingredientId_outletId: {
            ingredientId: recipe.ingredientId,
            outletId,
          },
        },
      });

      if (!stock) continue;

      const newStock = Math.max(stock.currentStock - deductQty, 0);

      await prisma.ingredientStock.update({
        where: { id: stock.id },
        data: { currentStock: newStock, lastUpdated: new Date() },
      });

      await prisma.stockMovement.create({
        data: {
          ingredientId: recipe.ingredientId,
          outletId,
          movementType: "out",
          quantity: deductQty,
          referenceType: "order",
          referenceId: orderId,
          notes: `Auto-deduct for ${orderItem.menuItem.name}`,
          createdById: userId,
        },
      });
    }
  }
}

export async function getLowStockAlerts(outletId: string) {
  const stocks = await prisma.ingredientStock.findMany({
    where: { outletId },
    include: { ingredient: true },
  });

  return stocks
    .filter((s) => s.currentStock < s.ingredient.minStockLevel)
    .map((s) => ({
      ingredientId: s.ingredientId,
      name: s.ingredient.name,
      unit: s.ingredient.unit,
      currentStock: s.currentStock,
      minStockLevel: s.ingredient.minStockLevel,
    }));
}
