import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { handleApiError, jsonError } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireAuth(["admin", "manager", "cashier"]);
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, outletId: user.outletId },
      include: {
        items: { include: { menuItem: true, modifiers: { include: { modifier: true } } } },
        table: true,
        payments: true,
        receipts: true,
      },
    });

    if (!order) return jsonError("Order not found", 404);

    const settings = await getSettings();
    const header = settings.receipt_header ?? "Restaurant POS";
    const footer = settings.receipt_footer ?? "Terima kasih!";

    const lines: string[] = [
      "================================",
      `       ${header}`,
      "================================",
      `No Order : ${order.orderNumber}`,
      `Tipe     : ${order.orderType}`,
      order.table ? `Meja     : ${order.table.tableNumber}` : "",
      order.customerName ? `Pelanggan: ${order.customerName}` : "",
      `Tanggal  : ${new Date(order.createdAt).toLocaleString("id-ID")}`,
      "--------------------------------",
    ].filter(Boolean);

    for (const item of order.items) {
      lines.push(`${item.menuItem.name} x${item.quantity}`);
      lines.push(`  ${formatCurrency(item.subtotal)}`);
      for (const mod of item.modifiers) {
        lines.push(`  + ${mod.modifier.name}`);
      }
    }

    lines.push(
      "--------------------------------",
      `Subtotal : ${formatCurrency(order.subtotal)}`,
      `Pajak    : ${formatCurrency(order.taxAmount)}`,
      `Service  : ${formatCurrency(order.serviceCharge)}`,
      order.discountAmount > 0 ? `Diskon   : -${formatCurrency(order.discountAmount)}` : "",
      `TOTAL    : ${formatCurrency(order.totalAmount)}`,
      "================================",
      `       ${footer}`,
      "================================",
      "",
      "\x1B\x40", // ESC @ init printer
    );

    const text = lines.filter(Boolean).join("\n");

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename="receipt-${order.orderNumber}.txt"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
