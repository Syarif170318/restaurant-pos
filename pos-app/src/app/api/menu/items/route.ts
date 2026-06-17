import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager"]);
    const body = await request.json();
    const { categoryId, name, description, price, takeawayPrice, availableFrom, availableTo, station } = body as {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      takeawayPrice?: number;
      availableFrom?: string;
      availableTo?: string;
      station?: string;
    };

    if (!categoryId || !name || price == null) {
      return jsonError("Category, name, and price are required");
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        price,
        takeawayPrice: takeawayPrice ?? null,
        availableFrom: availableFrom ?? null,
        availableTo: availableTo ?? null,
        station: station ?? "grill",
      },
      include: { modifiers: true, category: true },
    });
    return jsonOk(item, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
