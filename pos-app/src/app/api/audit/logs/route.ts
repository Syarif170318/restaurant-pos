import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 100), 500);

    const [loginAudits, transactionLogs] = await Promise.all([
      prisma.loginAudit.findMany({
        include: {
          user: { select: { id: true, username: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.transactionLog.findMany({
        include: {
          performedBy: { select: { id: true, fullName: true, role: true } },
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return jsonOk({ loginAudits, transactionLogs });
  } catch (error) {
    return handleApiError(error);
  }
}
