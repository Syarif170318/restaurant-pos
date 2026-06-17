import { requireAuth } from "@/lib/auth";
import { getLowStockAlerts } from "@/lib/inventory";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth(["admin", "manager", "inventory"]);
    const alerts = await getLowStockAlerts(user.outletId);
    return jsonOk(alerts);
  } catch (error) {
    return handleApiError(error);
  }
}
