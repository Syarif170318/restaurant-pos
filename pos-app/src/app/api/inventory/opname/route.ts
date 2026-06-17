import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const { ingredientId, actualStock, notes } = (await request.json()) as {
      ingredientId: string;
      actualStock: number;
      notes?: string;
    };

    if (!ingredientId || actualStock == null || Number.isNaN(actualStock) || actualStock < 0) {
      return jsonError("Invalid opname data");
    }

    const stock = await prisma.ingredientStock.findUnique({
      where: {
        ingredientId_outletId: { ingredientId, outletId: user.outletId },
      },
    });
    if (!stock) return jsonError("Ingredient stock not found", 404);

    const diff = actualStock - stock.currentStock;
    if (diff === 0) return jsonError("No adjustment needed");

    await prisma.$transaction([
      prisma.ingredientStock.update({
        where: { id: stock.id },
        data: { currentStock: actualStock, lastUpdated: new Date() },
      }),
      prisma.stockMovement.create({
        data: {
          ingredientId,
          outletId: user.outletId,
          movementType: "adjustment",
          quantity: Math.abs(diff),
          referenceType: "opname",
          notes: notes ?? `Opname adjustment: ${diff > 0 ? "+" : ""}${diff}`,
          createdById: user.id,
        },
      }),
    ]);

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: { stocks: { where: { outletId: user.outletId } } },
    });

    return jsonOk({ ingredient, adjustment: diff });
  } catch (error) {
    return handleApiError(error);
  }
}
