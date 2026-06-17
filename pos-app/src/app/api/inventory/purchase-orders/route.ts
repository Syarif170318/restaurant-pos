import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const status = request.nextUrl.searchParams.get("status");
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        outletId: user.outletId,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
      orderBy: { createdAt: "desc" },
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
      supplierId?: string;
      notes?: string;
      items?: Array<{ ingredientId: string; quantity: number; unitPrice?: number }>;
    };

    if (!supplierId || !items?.length) {
      return jsonError("Supplier and items are required");
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || !supplier.isActive) return jsonError("Supplier not found", 404);

    for (const item of items) {
      if (!item.ingredientId || !item.quantity || item.quantity <= 0) {
        return jsonError("Each item must have ingredient and positive quantity");
      }
      const ingredient = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
      if (!ingredient) return jsonError(`Ingredient not found: ${item.ingredientId}`, 404);
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice ?? 0),
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
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
      },
    });
    return jsonOk(order, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
