import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return jsonOk(suppliers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(["admin", "manager", "inventory"]);
    const body = await request.json();
    const { name, contactPerson, phone, email } = body as {
      name: string;
      contactPerson: string;
      phone: string;
      email?: string;
    };

    if (!name || !contactPerson || !phone) {
      return jsonError("Name, contact person, and phone are required");
    }

    const supplier = await prisma.supplier.create({
      data: { name, contactPerson, phone, email },
    });
    return jsonOk(supplier, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
