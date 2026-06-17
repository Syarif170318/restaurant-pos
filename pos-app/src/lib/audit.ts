import { prisma } from "@/lib/prisma";

export async function logLogin(userId: string, action: "login" | "logout", ip?: string) {
  try {
    await prisma.loginAudit.create({
      data: { userId, action, ipAddress: ip },
    });
  } catch {
    // audit failure must not block login/logout
  }
}
