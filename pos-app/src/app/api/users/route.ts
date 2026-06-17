import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { UserRole } from "@/generated/prisma/client";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    const users = await prisma.user.findMany({
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        pinCode: true,
        isActive: true,
        outletId: true,
        createdAt: true,
        outlet: { select: { name: true, code: true } },
      },
    });
    return jsonOk(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await request.json();
    const { username, password, fullName, role, outletId, pinCode } = body as {
      username: string;
      password: string;
      fullName: string;
      role: UserRole;
      outletId: string;
      pinCode?: string;
    };

    if (!username?.trim() || !password || !fullName?.trim() || !role || !outletId) {
      return jsonError("Username, password, full name, role, and outlet are required");
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) return jsonError("Username already exists");

    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (!outlet) return jsonError("Outlet not found");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        role,
        outletId,
        pinCode: pinCode?.trim() || null,
      },
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
    return jsonOk(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
