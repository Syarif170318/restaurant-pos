import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireAuth();
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          include: { modifiers: true },
          orderBy: { name: "asc" },
        },
      },
    });
    return jsonOk(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager"]);
    const body = await request.json();
    const { name, sortOrder, availableFrom, availableTo } = body as {
      name?: string;
      sortOrder?: number;
      availableFrom?: string;
      availableTo?: string;
    };

    if (!name?.trim()) {
      return jsonError("Name is required");
    }

    const category = await prisma.menuCategory.create({
      data: {
        name: name.trim(),
        sortOrder: sortOrder ?? 0,
        availableFrom: availableFrom ?? null,
        availableTo: availableTo ?? null,
      },
    });
    return jsonOk(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
