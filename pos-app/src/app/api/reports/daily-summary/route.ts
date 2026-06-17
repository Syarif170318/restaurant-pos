import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import {
  fetchSalesSummary,
  getDateRange,
  parsePeriod,
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

    return jsonOk(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
