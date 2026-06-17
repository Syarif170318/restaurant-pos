import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const outlet = await prisma.outlet.findUnique({
    where: { id: session.outletId },
    select: { name: true, code: true },
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={session} outlet={outlet} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
