import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const manage = request.nextUrl.searchParams.get("manage") === "true";
    const isManager = ["admin", "manager"].includes(user.role);

    const tables = await prisma.table.findMany({
      where: {
        outletId: user.outletId,
        ...(manage && isManager ? {} : { isActive: true }),
      },
      orderBy: { tableNumber: "asc" },
    });
    return jsonOk(tables);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const body = await request.json();
    const { tableNumber, capacity, area } = body as {
      tableNumber?: string;
      capacity?: number;
      area?: string;
    };

    if (!tableNumber?.trim() || !capacity || capacity < 1) {
      return jsonError("Table number and capacity are required");
    }

    const existing = await prisma.table.findFirst({
      where: { outletId: user.outletId, tableNumber: tableNumber.trim() },
    });
    if (existing) return jsonError("Table number already exists for this outlet");

    const table = await prisma.table.create({
      data: {
        tableNumber: tableNumber.trim(),
        capacity,
        area: area?.trim() || "Indoor",
        outletId: user.outletId,
      },
    });
    return jsonOk(table, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
