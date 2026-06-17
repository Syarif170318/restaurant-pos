import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const { id } = await params;
    const body = await request.json();
    const { name, unit, minStockLevel, isActive } = body as {
      name?: string;
      unit?: string;
      minStockLevel?: number;
      isActive?: boolean;
    };

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) return jsonError("Ingredient not found", 404);

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(unit !== undefined && { unit: unit.trim() }),
        ...(minStockLevel !== undefined && { minStockLevel }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
