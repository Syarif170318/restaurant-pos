import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const { ingredientId, quantity, notes, supplierId } = (await request.json()) as {
      ingredientId: string;
      quantity: number;
      notes?: string;
      supplierId?: string;
    };

    if (!ingredientId || !quantity || quantity <= 0) {
      return jsonError("Invalid restock data");
    }

    const stock = await prisma.ingredientStock.findUnique({
      where: {
        ingredientId_outletId: { ingredientId, outletId: user.outletId },
      },
    });

    if (!stock) return jsonError("Ingredient stock not found", 404);

    const newStock = stock.currentStock + quantity;

    await prisma.$transaction([
      prisma.ingredientStock.update({
        where: { id: stock.id },
        data: { currentStock: newStock, lastUpdated: new Date() },
      }),
      prisma.stockMovement.create({
        data: {
          ingredientId,
          outletId: user.outletId,
          movementType: "in",
          quantity,
          referenceType: "restock",
          notes,
          supplierId,
          createdById: user.id,
        },
      }),
    ]);

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { stocks: { where: { outletId: user.outletId } } },
    });

    return jsonOk(ingredient);
  } catch (error) {
    return handleApiError(error);
  }
}
