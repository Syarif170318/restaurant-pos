import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { UserRole } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth(["admin"]);
    const { id } = await params;
    const body = await request.json();
    const { fullName, role, outletId, password, pinCode, isActive } = body as {
      fullName?: string;
      role?: UserRole;
      outletId?: string;
      password?: string;
      pinCode?: string;
      isActive?: boolean;
    };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError("User not found", 404);

    if (outletId) {
      const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
      if (!outlet) return jsonError("Outlet not found");
    }

    const data: Record<string, unknown> = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (role !== undefined) data.role = role;
    if (outletId !== undefined) data.outletId = outletId;
    if (pinCode !== undefined) data.pinCode = pinCode.trim() || null;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        pinCode: true,
        isActive: true,
        outletId: true,
        outlet: { select: { name: true, code: true } },
      },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
