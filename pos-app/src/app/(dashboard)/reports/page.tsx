"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  ShoppingBag,
  TrendingUp,
  Users,
  Smartphone,
  Download,
  Printer,
  Package,
} from "lucide-react";

type ReportPeriod = "day" | "week" | "month";

interface ReportData {
  dateFrom: string;
  dateTo: string;
  period: ReportPeriod;
  totalSales: number;
  orderCount: number;
  avgTicket: number;
  revenueByCategory: Record<string, number>;
  bestSellers: Array<{ name: string; qty: number; revenue: number }>;
  staffPerformance: Array<{ name: string; orders: number; revenue: number }>;
  paymentBreakdown: { cash: number; card: number; digital_wallet: number };
}

interface IngredientUsageItem {
  ingredientId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  movementCount: number;
}

interface OutletOption {
  id: string;
  name: string;
  code: string | null;
}

interface ForecastData {
  basedOnDays: number;
  avgDailySales: number;
  avgDailyOrders: number;
  forecastNext7Days: { sales: number; orders: number };
  forecastNext30Days: { sales: number; orders: number };
  trend: "up" | "down" | "stable";
}

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: "Harian",
  week: "Mingguan",
  month: "Bulanan",
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [ingredientUsage, setIngredientUsage] = useState<IngredientUsageItem[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewInventory, setCanViewInventory] = useState(false);
  const [outlets, setOutlets] = useState<OutletOption[]>([]);
  const [outletId, setOutletId] = useState("");
  const [forecast, setForecast] = useState<ForecastData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.role === "admin") {
          setIsAdmin(true);
          setCanViewInventory(true);
          fetch("/api/outlets")
            .then((r) => r.json())
            .then((od) => {
              if (od.success && od.data.length > 0) {
                setOutlets(od.data);
                setOutletId(od.data[0].id);
              }
            });
        } else if (d.success) {
          setOutletId(d.data.outletId);
          setCanViewInventory(["manager", "inventory"].includes(d.data.role));
        }
      });
  }, []);

  useEffect(() => {
    if (!outletId && isAdmin) return;
    setLoading(true);
    const params = new URLSearchParams({ date, period });
    if (isAdmin && outletId) params.set("outletId", outletId);

    const fetches: Promise<void>[] = [
      fetch(`/api/reports/daily-summary?${params}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setReport(d.data);
        }),
    ];

    if (canViewInventory) {
      fetches.push(
        fetch(`/api/reports/ingredient-usage?${params}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setIngredientUsage(d.data.usage);
          }),
      );
    } else {
      setIngredientUsage([]);
    }

    fetches.push(
      fetch(`/api/reports/forecast?${isAdmin && outletId ? `outletId=${outletId}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setForecast(d.data);
        }),
    );

    Promise.all(fetches).finally(() => setLoading(false));
  }, [date, period, outletId, isAdmin, canViewInventory]);

  function buildExportParams() {
    const params = new URLSearchParams({ date, period });
    if (isAdmin && outletId) params.set("outletId", outletId);
    return params;
  }

  function handleExportCsv() {
    window.location.href = `/api/reports/export/csv?${buildExportParams()}`;
  }

  function handlePrintPdf() {
    window.open(`/api/reports/export/pdf?${buildExportParams()}`, "_blank");
  }

  if (loading || !report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Loading reports...</p>
      </div>
    );
  }

  const maxCategory = Math.max(...Object.values(report.revenueByCategory), 1);
  const categoryEntries = Object.entries(report.revenueByCategory);
  const periodLabel = PERIOD_LABELS[period];
  const dateRangeLabel =
    report.dateFrom === report.dateTo
      ? report.dateFrom
      : `${report.dateFrom} – ${report.dateTo}`;

  return (
    <div className="p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports Dashboard</h1>
            <p className="text-sm text-slate-500">
              Ringkasan penjualan {periodLabel.toLowerCase()} — {dateRangeLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && outlets.length > 0 && (
            <select
              value={outletId}
              onChange={(e) => setOutletId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {o.code ? ` (${o.code})` : ""}
                </option>
              ))}
            </select>
          )}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Printer className="h-4 w-4" />
            Print PDF
          </button>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Smartphone className="h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-sm text-blue-800">
          <strong>POS Mobile App</strong> — Kasir & Waiter pakai app Android/iOS di folder <code className="rounded bg-blue-100 px-1">pos-mobile</code>. Dashboard ini untuk manage & laporan.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Sales", value: formatCurrency(report.totalSales), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: `Orders (${periodLabel})`, value: String(report.orderCount), icon: ShoppingBag, color: "text-green-600 bg-green-50" },
          { label: "Avg Ticket", value: formatCurrency(report.avgTicket), icon: BarChart3, color: "text-purple-600 bg-purple-50" },
          { label: "Top Item", value: report.bestSellers[0]?.name ?? "-", icon: Users, color: "text-orange-600 bg-orange-50" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800">Revenue by Category — Bar Chart</h3>
        {categoryEntries.length > 0 ? (
          <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 200 }}>
            {categoryEntries.map(([cat, rev]) => (
              <div key={cat} className="flex min-w-[72px] flex-1 flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-600">{formatCurrency(rev)}</span>
                <div
                  className="w-full rounded-t-md bg-teal-500 transition-all"
                  style={{ height: `${Math.max((rev / maxCategory) * 160, 4)}px` }}
                  title={`${cat}: ${formatCurrency(rev)}`}
                />
                <span className="max-w-[80px] truncate text-center text-xs text-slate-500" title={cat}>
                  {cat}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Belum ada data penjualan untuk periode ini</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Revenue by Category</h3>
          <div className="space-y-3">
            {categoryEntries.map(([cat, rev]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{formatCurrency(rev)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${(rev / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {categoryEntries.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada data penjualan untuk periode ini</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Best Sellers</h3>
          <div className="space-y-2">
            {report.bestSellers.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{item.qty}x</p>
                  <p className="text-slate-500">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
            {report.bestSellers.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Staff Performance</h3>
          <div className="space-y-2">
            {report.staffPerformance.map((staff) => (
              <div key={staff.name} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium">{staff.name}</span>
                <span>{staff.orders} orders — {formatCurrency(staff.revenue)}</span>
              </div>
            ))}
            {report.staffPerformance.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada data</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Payment Methods</h3>
          <div className="space-y-2">
            {Object.entries(report.paymentBreakdown).map(([method, amount]) => (
              <div key={method} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="capitalize font-medium">{method.replace("_", " ")}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {forecast && (
        <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-indigo-900">Sales Forecast (Analytics)</h3>
          <p className="mb-4 text-sm text-indigo-700">
            Berdasarkan {forecast.basedOnDays} hari terakhir — trend{" "}
            <span className="font-semibold">{forecast.trend}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-slate-500">Rata-rata harian</p>
              <p className="font-bold">{formatCurrency(forecast.avgDailySales)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-slate-500">Order/hari</p>
              <p className="font-bold">{forecast.avgDailyOrders}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-slate-500">Proyeksi 7 hari</p>
              <p className="font-bold">{formatCurrency(forecast.forecastNext7Days.sales)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-slate-500">Proyeksi 30 hari</p>
              <p className="font-bold">{formatCurrency(forecast.forecastNext30Days.sales)}</p>
            </div>
          </div>
        </div>
      )}

      {canViewInventory && (
        <div id="ingredient-usage" className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Ingredient Usage (Stock Out)</h3>
          </div>
          <div className="space-y-2">
            {ingredientUsage.map((item) => (
              <div
                key={item.ingredientId}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-600">
                  {item.totalQuantity} {item.unit} — {item.movementCount} movements
                </span>
              </div>
            ))}
            {ingredientUsage.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada penggunaan bahan untuk periode ini</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
