import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLoyaltySettings } from "@/lib/loyalty";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager", "cashier"]);
    const phone = request.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
    if (!phone) return jsonError("Phone required");

    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) return jsonError("Customer not found", 404);

    const settings = await getLoyaltySettings();
    return jsonOk({ customer, settings });
  } catch (error) {
    return handleApiError(error);
  }
}
