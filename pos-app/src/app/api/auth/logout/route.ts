import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getSession } from "@/lib/auth";
import { logLogin } from "@/lib/audit";
import { handleApiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        undefined;
      await logLogin(session.id, "logout", ip);
    }

    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
