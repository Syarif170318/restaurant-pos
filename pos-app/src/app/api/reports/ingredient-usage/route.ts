import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import {
  fetchIngredientUsage,
  getDateRange,
  parsePeriod,
} from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);

    const dateParam = request.nextUrl.searchParams.get("date");
    const period = parsePeriod(request.nextUrl.searchParams.get("period"));
    const outletParam = request.nextUrl.searchParams.get("outletId");
    const outletId =
      user.role === "admin" && outletParam ? outletParam : user.outletId;

    const range = getDateRange(dateParam, period);
    const usage = await fetchIngredientUsage(outletId, range);

    return jsonOk({
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      period: range.period,
      usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
