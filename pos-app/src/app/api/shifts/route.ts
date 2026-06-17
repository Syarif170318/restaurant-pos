import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const shift = await prisma.shift.findFirst({
      where: { userId: user.id, outletId: user.outletId, status: "open" },
      orderBy: { openedAt: "desc" },
    });
    return jsonOk(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const body = await request.json();
    const { action, openingCash, closingCash } = body as {
      action: "open" | "close";
      openingCash?: number;
      closingCash?: number;
    };

    if (action === "open") {
      const existing = await prisma.shift.findFirst({
        where: { userId: user.id, outletId: user.outletId, status: "open" },
      });
      if (existing) return jsonError("Shift already open");

      const shift = await prisma.shift.create({
        data: {
          userId: user.id,
          outletId: user.outletId,
          openingCash: openingCash ?? 0,
          status: "open",
        },
      });
      return jsonOk(shift, 201);
    }

    if (action === "close") {
      const shift = await prisma.shift.findFirst({
        where: { userId: user.id, outletId: user.outletId, status: "open" },
      });
      if (!shift) return jsonError("No open shift found");

      const startOfShift = shift.openedAt;
      const sales = await prisma.payment.aggregate({
        where: {
          processedById: user.id,
          paidAt: { gte: startOfShift },
          status: "completed",
        },
        _sum: { amount: true },
      });

      const updated = await prisma.shift.update({
        where: { id: shift.id },
        data: {
          status: "closed",
          closedAt: new Date(),
          closingCash: closingCash ?? 0,
          totalSales: sales._sum.amount ?? 0,
        },
      });
      return jsonOk(updated);
    }

    return jsonError("Invalid action");
  } catch (error) {
    return handleApiError(error);
  }
}
