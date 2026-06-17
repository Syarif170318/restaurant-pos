import { NextRequest } from "next/server";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getPublicMenu, getOutletTables, resolveOutlet } from "@/lib/public-order";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("outlet");
    if (!code) return jsonError("Outlet code required");

    const outlet = await resolveOutlet(code);
    if (!outlet) return jsonError("Outlet not found", 404);

    const [categories, tables] = await Promise.all([
      getPublicMenu(outlet.id),
      getOutletTables(outlet.id),
    ]);

    return jsonOk({
      outlet: { id: outlet.id, name: outlet.name, code: outlet.code },
      categories,
      tables,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
