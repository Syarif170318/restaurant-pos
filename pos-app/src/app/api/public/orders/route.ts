import { NextRequest } from "next/server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { createQrOrder, resolveOutlet } from "@/lib/public-order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      outletCode,
      tableNumber,
      customerName,
      customerPhone,
      items,
    } = body as {
      outletCode: string;
      tableNumber?: string;
      customerName?: string;
      customerPhone?: string;
      items: Array<{
        menuItemId: string;
        quantity: number;
        modifierIds?: string[];
        notes?: string;
      }>;
    };

    if (!outletCode || !items?.length) {
      return jsonError("Outlet code and items are required");
    }

    const outlet = await resolveOutlet(outletCode);
    if (!outlet) return jsonError("Outlet not found", 404);

    const order = await createQrOrder({
      outletId: outlet.id,
      tableNumber,
      customerName,
      customerPhone,
      items,
    });

    return jsonOk(
      {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        message: "Pesanan berhasil dikirim ke dapur",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
