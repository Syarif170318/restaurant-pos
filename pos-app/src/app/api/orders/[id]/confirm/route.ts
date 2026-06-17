import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { confirmOrder } from "@/lib/order";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier", "waiter"]);
    const { id } = await params;
    const order = await confirmOrder(id, user.id, user.outletId);
    return jsonOk(order);
  } catch (error) {
    return handleApiError(error);
  }
}
