import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import {
  fetchSalesSummary,
  getDateRange,
  parsePeriod,
  salesSummaryToHtml,
} from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager"]);

    const dateParam = request.nextUrl.searchParams.get("date");
    const period = parsePeriod(request.nextUrl.searchParams.get("period"));
    const outletParam = request.nextUrl.searchParams.get("outletId");
    const outletId =
      user.role === "admin" && outletParam ? outletParam : user.outletId;

    const range = getDateRange(dateParam, period);
    const summary = await fetchSalesSummary(outletId, range);
    const html = salesSummaryToHtml(summary);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
