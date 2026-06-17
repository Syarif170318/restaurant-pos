import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager"]);
    const { menuItemId, name, extraPrice } = (await request.json()) as {
      menuItemId: string;
      name: string;
      extraPrice?: number;
    };

    if (!menuItemId || !name) return jsonError("Menu item and name required");

    const modifier = await prisma.menuModifier.create({
      data: { menuItemId, name, extraPrice: extraPrice ?? 0 },
    });
    return jsonOk(modifier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
