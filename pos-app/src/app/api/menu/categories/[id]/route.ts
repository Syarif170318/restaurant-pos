import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const body = await request.json();
    const { name, sortOrder, isActive, availableFrom, availableTo } = body as {
      name?: string;
      sortOrder?: number;
      isActive?: boolean;
      availableFrom?: string | null;
      availableTo?: string | null;
    };

    const category = await prisma.menuCategory.findUnique({ where: { id } });
    if (!category) return jsonError("Category not found", 404);

    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(availableFrom !== undefined && { availableFrom }),
        ...(availableTo !== undefined && { availableTo }),
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
