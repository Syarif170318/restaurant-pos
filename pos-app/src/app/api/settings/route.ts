import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireAuth(["admin", "manager"]);
    const settings = await getSettings();
    return jsonOk(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(["admin"]);
    const body = (await request.json()) as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    const settings = await getSettings();
    return jsonOk(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
