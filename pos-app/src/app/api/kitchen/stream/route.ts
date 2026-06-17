import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { orderInclude } from "@/lib/order";

export const dynamic = "force-dynamic";

async function fetchKitchenOrders(outletId: string) {
  return prisma.order.findMany({
    where: {
      status: { in: ["confirmed", "preparing", "ready"] },
      outletId,
    },
    include: orderInclude,
    orderBy: [{ isRush: "desc" }, { confirmedAt: "asc" }],
  });
}

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "kitchen", "cashier", "waiter"]);

    const encoder = new TextEncoder();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const send = async () => {
          try {
            const orders = await fetchKitchenOrders(user.outletId);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ success: true, data: orders })}\n\n`),
            );
          } catch {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ success: false, error: "poll_failed" })}\n\n`),
            );
          }
        };

        await send();
        intervalId = setInterval(send, 2000);
      },
      cancel() {
        if (intervalId) clearInterval(intervalId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
