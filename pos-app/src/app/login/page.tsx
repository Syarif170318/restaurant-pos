"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_USERS = [
  { username: "kasir1", label: "Kasir (Rina)", pin: "1111" },
  { username: "dapur1", label: "Dapur (Budi)", pin: "2222" },
  { username: "manager1", label: "Manager (Andi)", pin: "3333" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("kasir1");
  const [password, setPassword] = useState("password123");
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        usePin ? { username, pin } : { username, password },
      ),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || "Login gagal");
      return;
    }

    const role = data.data.role;
    if (role === "kitchen") router.push("/kitchen");
    else if (role === "inventory") router.push("/inventory");
    else if (role === "cashier" || role === "waiter") router.push("/reports");
    else router.push("/reports");
    router.refresh();
  }

  function quickLogin(u: string, p: string) {
    setUsername(u);
    setPin(p);
    setUsePin(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Restaurant POS</h1>
          <p className="text-sm text-slate-500">Restaurant / Point of Sale</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUsePin(false)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${!usePin ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setUsePin(true)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium ${usePin ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
            >
              PIN
            </button>
          </div>

          {usePin ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">PIN</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="password"
                maxLength={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Loading..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="mb-3 text-center text-xs text-slate-500">Quick Login Demo</p>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => quickLogin(u.username, u.pin)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="font-medium">{u.label}</span>
                <span className="ml-2 text-slate-400">PIN: {u.pin}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
