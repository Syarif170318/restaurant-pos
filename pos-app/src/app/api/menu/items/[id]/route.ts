import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const body = await request.json();

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        takeawayPrice: body.takeawayPrice ?? null,
        availableFrom: body.availableFrom ?? null,
        availableTo: body.availableTo ?? null,
        station: body.station,
        isAvailable: body.isAvailable,
        isActive: body.isActive,
        categoryId: body.categoryId,
      },
      include: { modifiers: true, category: true },
    });
    return jsonOk(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const { isAvailable } = (await request.json()) as { isAvailable: boolean };

    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });
    return jsonOk(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth(["admin", "manager"]);
    const { id } = await params;
    await prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
    return jsonOk({ message: "Item deactivated" });
  } catch (error) {
    return handleApiError(error);
  }
}
