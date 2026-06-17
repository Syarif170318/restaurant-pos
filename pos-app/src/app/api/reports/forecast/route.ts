import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { fetchSalesForecast } from "@/lib/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(["admin", "manager"]);
    const outletParam = request.nextUrl.searchParams.get("outletId");
    const outletId =
      user.role === "admin" && outletParam ? outletParam : user.outletId;

    const forecast = await fetchSalesForecast(outletId);
    return jsonOk(forecast);
  } catch (error) {
    return handleApiError(error);
  }
}
