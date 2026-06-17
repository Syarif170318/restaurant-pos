import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const menuItemId = request.nextUrl.searchParams.get("menuItemId");
    if (!menuItemId) return jsonError("menuItemId query parameter is required");

    const recipes = await prisma.recipe.findMany({
      where: { menuItemId },
      include: {
        ingredient: true,
        menuItem: { select: { id: true, name: true } },
      },
      orderBy: { ingredient: { name: "asc" } },
    });
    return jsonOk(recipes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const body = await request.json();
    const { menuItemId, ingredientId, quantityNeeded } = body as {
      menuItemId?: string;
      ingredientId?: string;
      quantityNeeded?: number;
    };

    if (!menuItemId || !ingredientId || !quantityNeeded || quantityNeeded <= 0) {
      return jsonError("Menu item, ingredient, and quantity are required");
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem) return jsonError("Menu item not found", 404);

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) return jsonError("Ingredient not found", 404);

    const recipe = await prisma.recipe.create({
      data: { menuItemId, ingredientId, quantityNeeded },
      include: { ingredient: true, menuItem: { select: { id: true, name: true } } },
    });
    return jsonOk(recipe, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query parameter is required");

    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return jsonError("Recipe not found", 404);

    await prisma.recipe.delete({ where: { id } });
    return jsonOk({ message: "Recipe deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
