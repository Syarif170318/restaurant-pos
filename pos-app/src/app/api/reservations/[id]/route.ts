import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import type { ReservationStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const { id } = await params;
    const { status } = (await request.json()) as { status?: ReservationStatus };

    if (!status) return jsonError("Status is required");

    const reservation = await prisma.reservation.findFirst({
      where: { id, outletId: user.outletId },
    });
    if (!reservation) return jsonError("Reservation not found", 404);

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true },
    });
    return jsonOk(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
