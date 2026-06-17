"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  Boxes,
  Package,
  BarChart3,
  LogOut,
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  Truck,
  Clock,
  Smartphone,
  Store,
  Gift,
  QrCode,
  Users,
  LayoutGrid,
  Calendar,
  ClipboardList,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const navItems = [
  { href: "/reports", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { href: "/kitchen", label: "Kitchen (KDS)", icon: ChefHat, roles: ["admin", "manager", "kitchen"] },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed, roles: ["admin", "manager"] },
  { href: "/delivery", label: "Delivery", icon: Package, roles: ["admin", "manager"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "manager", "inventory"] },
  { href: "/suppliers", label: "Suppliers", icon: Truck, roles: ["admin", "manager", "inventory"] },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList, roles: ["admin", "manager", "inventory"] },
  { href: "/shifts", label: "Shift", icon: Clock, roles: ["admin", "manager"] },
  { href: "/loyalty", label: "Loyalty", icon: Gift, roles: ["admin", "manager"] },
  { href: "/reservations", label: "Reservations", icon: Calendar, roles: ["admin", "manager"] },
  { href: "/tables", label: "Tables", icon: LayoutGrid, roles: ["admin", "manager"] },
  { href: "/outlets", label: "Outlets", icon: Store, roles: ["admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/audit", label: "Audit Log", icon: FileText, roles: ["admin"] },
  { href: "/qr-links", label: "QR Menu", icon: QrCode, roles: ["admin", "manager"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

const MOBILE_ROLES = ["cashier", "waiter"];

export function Sidebar({
  user,
  outlet,
}: {
  user: SessionUser;
  outlet?: { name: string; code: string | null } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobileRole = MOBILE_ROLES.includes(user.role);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-2 text-blue-600">
          <LayoutDashboard className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Restaurant POS</h1>
            <p className="text-xs text-slate-500">Management Dashboard</p>
          </div>
        </div>
      </div>

      {isMobileRole ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <Smartphone className="mb-4 h-12 w-12 text-blue-500" />
          <h2 className="mb-2 font-semibold text-slate-800">Gunakan Mobile App</h2>
          <p className="text-sm text-slate-500">
            Role <span className="font-medium capitalize">{user.role}</span> menggunakan
            aplikasi Android/iOS untuk order & pembayaran.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Install app: <strong>pos-mobile</strong>
          </p>
        </div>
      ) : (
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      )}

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-900">{user.fullName}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
          {outlet && (
            <p className="mt-1 text-xs text-violet-600">
              {outlet.name}
              {outlet.code ? ` (${outlet.code})` : ""}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
