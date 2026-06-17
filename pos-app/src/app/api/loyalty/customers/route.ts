import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateCustomer } from "@/lib/loyalty";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const customers = await prisma.customer.findMany({
      where: user.role === "admin" ? undefined : { outletId: user.outletId },
      orderBy: { loyaltyPoints: "desc" },
      take: 50,
    });
    return jsonOk(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const { phone, name } = (await request.json()) as { phone: string; name: string };
    if (!phone || !name) return jsonError("Phone and name required");

    const customer = await findOrCreateCustomer(phone, name, user.outletId);
    return jsonOk(customer, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
