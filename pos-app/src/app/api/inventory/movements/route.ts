import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const ingredientId = request.nextUrl.searchParams.get("ingredientId");
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 500);

    const movements = await prisma.stockMovement.findMany({
      where: {
        outletId: user.outletId,
        ...(ingredientId ? { ingredientId } : {}),
      },
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return jsonOk(movements);
  } catch (error) {
    return handleApiError(error);
  }
}
