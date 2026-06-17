import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    const body = await request.json();
    const { name, code, address, isActive } = body as {
      name?: string;
      code?: string;
      address?: string;
      isActive?: boolean;
    };

    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) return jsonError("Outlet not found", 404);

    if (code && code !== outlet.code) {
      const existing = await prisma.outlet.findUnique({ where: { code } });
      if (existing) return jsonError("Outlet code already exists");
    }

    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.trim() || null }),
        ...(address !== undefined && { address: address.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
