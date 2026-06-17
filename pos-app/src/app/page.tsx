import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const roleRedirects: Record<string, string> = {
    kitchen: "/kitchen",
    inventory: "/inventory",
    manager: "/reports",
    admin: "/reports",
    cashier: "/reports", // cashier uses mobile app; show info on dashboard layout
    waiter: "/reports",
  };

  redirect(roleRedirects[session.role] ?? "/reports");
}
