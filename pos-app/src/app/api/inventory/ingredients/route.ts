import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        stocks: { where: { outletId: user.outletId } },
      },
      orderBy: { name: "asc" },
    });
    const data = ingredients.map(({ stocks, ...ing }) => ({
      ...ing,
      stock: stocks[0] ?? null,
    }));
    return jsonOk(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const body = await request.json();
    const { name, unit, minStockLevel, initialStock } = body as {
      name?: string;
      unit?: string;
      minStockLevel?: number;
      initialStock?: number;
    };

    if (!name?.trim() || !unit?.trim() || minStockLevel == null) {
      return jsonError("Name, unit, and min stock level are required");
    }

    const stockAmount = initialStock ?? 0;
    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        unit: unit.trim(),
        minStockLevel,
        stocks: {
          create: {
            outletId: user.outletId,
            currentStock: stockAmount,
          },
        },
      },
      include: { stocks: { where: { outletId: user.outletId } } },
    });

    const { stocks, ...rest } = ingredient;
    return jsonOk({ ...rest, stock: stocks[0] ?? null }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
