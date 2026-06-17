import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setAuthCookie } from "@/lib/auth";
import { logLogin } from "@/lib/audit";
import { handleApiError, jsonError } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, pin } = body as {
      username?: string;
      password?: string;
      pin?: string;
    };

    if (!username) {
      return jsonError("Username is required");
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return jsonError("Invalid credentials", 401);
    }

    let valid = false;
    if (pin) {
      valid = user.pinCode === pin;
    } else if (password) {
      valid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!valid) {
      return jsonError("Invalid credentials", 401);
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;

    await logLogin(user.id, "login", ip);

    const token = await createToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      outletId: user.outletId,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        outletId: user.outletId,
        token, // for mobile app (Bearer auth)
      },
    });

    setAuthCookie(response, token);
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
