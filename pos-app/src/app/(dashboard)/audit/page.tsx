"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface LoginAudit {
  id: string;
  action: string;
  ipAddress: string | null;
  createdAt: string;
  user: { username: string; fullName: string; role: string };
}

interface TransactionLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  performedBy: { fullName: string; role: string };
  order: { orderNumber: string } | null;
}

type Tab = "login" | "transaction";

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [loginLogs, setLoginLogs] = useState<LoginAudit[]>([]);
  const [txnLogs, setTxnLogs] = useState<TransactionLog[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/audit/logs");
    const data = await res.json();
    if (data.success) {
      setLoginLogs(data.data.loginAudits);
      setTxnLogs(data.data.transactionLogs);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-slate-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
            <p className="text-sm text-slate-500">Login audit dan transaction logs</p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("login")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "login"
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-50",
          )}
        >
          Login Audit
        </button>
        <button
          onClick={() => setTab("transaction")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "transaction"
              ? "bg-blue-50 text-blue-700"
              : "text-slate-600 hover:bg-slate-50",
          )}
        >
          Transaction Logs
        </button>
      </div>

      {tab === "login" ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Aksi</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">IP</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{log.user.fullName}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {log.user.username} · {log.user.role}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize">{log.action}</td>
                  <td className="px-4 py-3 text-slate-500">{log.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loginLogs.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Belum ada login audit.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Aksi</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Detail</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {txnLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{log.performedBy.fullName}</p>
                    <p className="text-xs capitalize text-slate-500">{log.performedBy.role}</p>
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600">{log.details}</td>
                  <td className="px-4 py-3">{log.order?.orderNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {txnLogs.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Belum ada transaction log.</p>
          )}
        </div>
      )}
    </div>
  );
}
