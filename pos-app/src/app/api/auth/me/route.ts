import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("Unauthorized", 401);

    const outlet = await prisma.outlet.findUnique({
      where: { id: session.outletId },
      select: { id: true, name: true, code: true, address: true },
    });

    return jsonOk({ ...session, outlet });
  } catch (error) {
    return handleApiError(error);
  }
}
