import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const outlets = await prisma.outlet.findMany({
      where: user.role === "admin" ? undefined : { id: user.outletId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true, tables: true } },
      },
    });
    return jsonOk(outlets);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = await request.json();
    const { name, code, address } = body as {
      name: string;
      code?: string;
      address?: string;
    };

    if (!name?.trim()) {
      return jsonError("Name is required");
    }

    if (code) {
      const existing = await prisma.outlet.findUnique({ where: { code } });
      if (existing) return jsonError("Outlet code already exists");
    }

    const outlet = await prisma.outlet.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        address: address?.trim() || null,
      },
    });
    return jsonOk(outlet, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
