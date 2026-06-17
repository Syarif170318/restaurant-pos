import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { TableStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const body = await request.json();
    const { tableNumber, capacity, area, status, isActive } = body as {
      tableNumber?: string;
      capacity?: number;
      area?: string;
      status?: TableStatus;
      isActive?: boolean;
    };

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) return jsonError("Table not found", 404);
    if (user.role !== "admin" && table.outletId !== user.outletId) {
      return jsonError("Forbidden", 403);
    }

    const updated = await prisma.table.update({
      where: { id },
      data: {
        ...(tableNumber !== undefined && { tableNumber: tableNumber.trim() }),
        ...(capacity !== undefined && { capacity }),
        ...(area !== undefined && { area }),
        ...(status !== undefined && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const { id } = await params;

    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) return jsonError("Table not found", 404);
    if (user.role !== "admin" && table.outletId !== user.outletId) {
      return jsonError("Forbidden", 403);
    }

    await prisma.table.update({ where: { id }, data: { isActive: false } });
    return jsonOk({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
