import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const status = request.nextUrl.searchParams.get("status");
    const reservations = await prisma.reservation.findMany({
      where: {
        outletId: user.outletId,
        ...(status ? { status: status as never } : {}),
      },
      include: { table: true },
      orderBy: { reservedAt: "asc" },
    });
    return jsonOk(reservations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const body = await request.json();
    const { customerName, phone, partySize, reservedAt, tableId, notes } = body as {
      customerName?: string;
      phone?: string;
      partySize?: number;
      reservedAt?: string;
      tableId?: string;
      notes?: string;
    };

    if (!customerName?.trim() || !phone?.trim() || !partySize || !reservedAt) {
      return jsonError("Customer name, phone, party size, and reserved time are required");
    }

    if (tableId) {
      const table = await prisma.table.findFirst({
        where: { id: tableId, outletId: user.outletId, isActive: true },
      });
      if (!table) return jsonError("Table not found", 404);
    }

    const reservation = await prisma.reservation.create({
      data: {
        outletId: user.outletId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        partySize,
        reservedAt: new Date(reservedAt),
        tableId: tableId ?? null,
        notes: notes?.trim() || null,
      },
      include: { table: true },
    });
    return jsonOk(reservation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
