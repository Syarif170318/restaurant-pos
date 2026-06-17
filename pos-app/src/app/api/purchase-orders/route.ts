import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const orders = await prisma.purchaseOrder.findMany({
      where: { outletId: user.outletId },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            ingredient: { select: { name: true, unit: true } },
          },
        },
      },
    });
    return jsonOk(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const body = await request.json();
    const { supplierId, notes, items } = body as {
      supplierId: string;
      notes?: string;
      items: Array<{ ingredientId: string; quantity: number; unitPrice: number }>;
    };

    if (!supplierId || !items?.length) {
      return jsonError("Supplier and at least one item are required");
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) return jsonError("Supplier not found");

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );

    const order = await prisma.purchaseOrder.create({
      data: {
        outletId: user.outletId,
        supplierId,
        notes: notes?.trim() || null,
        totalAmount,
        createdById: user.id,
        items: {
          create: items.map((item) => ({
            ingredientId: item.ingredientId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            ingredient: { select: { name: true, unit: true } },
          },
        },
      },
    });
    return jsonOk(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
