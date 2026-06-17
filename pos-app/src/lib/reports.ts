import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { prisma } from "@/lib/prisma";

export type ReportPeriod = "day" | "week" | "month";

export interface DateRange {
  start: Date;
  end: Date;
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
}

export function parsePeriod(value: string | null): ReportPeriod {
  if (value === "week" || value === "month") return value;
  return "day";
}

export function getDateRange(dateParam: string | null, period: ReportPeriod): DateRange {
  const anchor = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  let start: Date;
  let end: Date;

  if (period === "week") {
    start = startOfWeek(anchor, { weekStartsOn: 1 });
    end = endOfWeek(anchor, { weekStartsOn: 1 });
  } else if (period === "month") {
    start = startOfMonth(anchor);
    end = endOfMonth(anchor);
  } else {
    start = startOfDay(anchor);
    end = endOfDay(anchor);
  }

  return {
    start,
    end,
    period,
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

export interface SalesSummary {
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

export async function fetchSalesSummary(
  outletId: string,
  range: DateRange,
): Promise<SalesSummary> {
  const paidOrders = await prisma.order.findMany({
    where: {
      status: "paid",
      outletId,
      paidAt: { gte: range.start, lte: range.end },
    },
    include: {
      items: { include: { menuItem: { include: { category: true } } } },
      payments: true,
      createdBy: { select: { fullName: true } },
    },
  });

  const totalSales = paidOrders.reduce((s, o) => s + o.totalAmount, 0);
  const orderCount = paidOrders.length;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

  const categoryMap = new Map<string, number>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const cat = item.menuItem.category.name;
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.subtotal);
    }
  }

  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      const existing = itemMap.get(item.menuItemId) ?? {
        name: item.menuItem.name,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += item.subtotal;
      itemMap.set(item.menuItemId, existing);
    }
  }

  const bestSellers = [...itemMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const staffMap = new Map<string, { name: string; orders: number; revenue: number }>();
  for (const order of paidOrders) {
    const name = order.createdBy.fullName;
    const existing = staffMap.get(name) ?? { name, orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += order.totalAmount;
    staffMap.set(name, existing);
  }

  const paymentBreakdown = { cash: 0, card: 0, digital_wallet: 0 };
  for (const order of paidOrders) {
    for (const p of order.payments) {
      paymentBreakdown[p.paymentMethod] += p.amount;
    }
  }

  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    period: range.period,
    totalSales,
    orderCount,
    avgTicket,
    revenueByCategory: Object.fromEntries(categoryMap),
    bestSellers,
    staffPerformance: [...staffMap.values()],
    paymentBreakdown,
  };
}

export function salesSummaryToCsv(summary: SalesSummary): string {
  const lines: string[] = [
    "Sales Summary Report",
    `Period,${summary.period}`,
    `Date From,${summary.dateFrom}`,
    `Date To,${summary.dateTo}`,
    "",
    "Metric,Value",
    `Total Sales,${summary.totalSales}`,
    `Order Count,${summary.orderCount}`,
    `Average Ticket,${summary.avgTicket}`,
    "",
    "Revenue by Category,Amount",
    ...Object.entries(summary.revenueByCategory).map(([cat, rev]) => `${cat},${rev}`),
    "",
    "Best Sellers,Name,Qty,Revenue",
    ...summary.bestSellers.map((item) => `,${item.name},${item.qty},${item.revenue}`),
    "",
    "Staff Performance,Name,Orders,Revenue",
    ...summary.staffPerformance.map((s) => `,${s.name},${s.orders},${s.revenue}`),
    "",
    "Payment Method,Amount",
    ...Object.entries(summary.paymentBreakdown).map(([method, amount]) => `${method},${amount}`),
  ];
  return lines.join("\n");
}

export function salesSummaryToHtml(summary: SalesSummary): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  const categoryRows = Object.entries(summary.revenueByCategory)
    .map(([cat, rev]) => `<tr><td>${cat}</td><td class="num">${fmt(rev)}</td></tr>`)
    .join("");

  const bestSellerRows = summary.bestSellers
    .map((item) => `<tr><td>${item.name}</td><td class="num">${item.qty}</td><td class="num">${fmt(item.revenue)}</td></tr>`)
    .join("");

  const staffRows = summary.staffPerformance
    .map((s) => `<tr><td>${s.name}</td><td class="num">${s.orders}</td><td class="num">${fmt(s.revenue)}</td></tr>`)
    .join("");

  const paymentRows = Object.entries(summary.paymentBreakdown)
    .map(([method, amount]) => `<tr><td>${method.replace("_", " ")}</td><td class="num">${fmt(amount)}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Sales Report ${summary.dateFrom} – ${summary.dateTo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
    .kpis { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
    .kpi label { font-size: 0.75rem; color: #64748b; display: block; }
    .kpi value { font-size: 1.25rem; font-weight: 700; }
    section { margin-bottom: 24px; }
    h2 { font-size: 1rem; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
    th { background: #f8fafc; font-weight: 600; }
    .num { text-align: right; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <h1>Sales Summary Report</h1>
  <p class="meta">Period: ${summary.period} &nbsp;|&nbsp; ${summary.dateFrom} to ${summary.dateTo}</p>
  <div class="kpis">
    <div class="kpi"><label>Total Sales</label><value>${fmt(summary.totalSales)}</value></div>
    <div class="kpi"><label>Orders</label><value>${summary.orderCount}</value></div>
    <div class="kpi"><label>Avg Ticket</label><value>${fmt(summary.avgTicket)}</value></div>
  </div>
  <section>
    <h2>Revenue by Category</h2>
    <table><thead><tr><th>Category</th><th class="num">Revenue</th></tr></thead><tbody>${categoryRows || "<tr><td colspan='2'>No data</td></tr>"}</tbody></table>
  </section>
  <section>
    <h2>Best Sellers</h2>
    <table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Revenue</th></tr></thead><tbody>${bestSellerRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody></table>
  </section>
  <section>
    <h2>Staff Performance</h2>
    <table><thead><tr><th>Staff</th><th class="num">Orders</th><th class="num">Revenue</th></tr></thead><tbody>${staffRows || "<tr><td colspan='3'>No data</td></tr>"}</tbody></table>
  </section>
  <section>
    <h2>Payment Methods</h2>
    <table><thead><tr><th>Method</th><th class="num">Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>
  </section>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export interface IngredientUsageItem {
  ingredientId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  movementCount: number;
}

export async function fetchIngredientUsage(
  outletId: string,
  range: DateRange,
): Promise<IngredientUsageItem[]> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      outletId,
      movementType: "out",
      createdAt: { gte: range.start, lte: range.end },
    },
    include: {
      ingredient: { select: { id: true, name: true, unit: true } },
    },
  });

  const usageMap = new Map<string, IngredientUsageItem>();
  for (const m of movements) {
    const existing = usageMap.get(m.ingredientId) ?? {
      ingredientId: m.ingredient.id,
      name: m.ingredient.name,
      unit: m.ingredient.unit,
      totalQuantity: 0,
      movementCount: 0,
    };
    existing.totalQuantity += m.quantity;
    existing.movementCount += 1;
    usageMap.set(m.ingredientId, existing);
  }

  return [...usageMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export interface SalesForecast {
  basedOnDays: number;
  avgDailySales: number;
  avgDailyOrders: number;
  forecastNext7Days: { sales: number; orders: number };
  forecastNext30Days: { sales: number; orders: number };
  trend: "up" | "down" | "stable";
}

export async function fetchSalesForecast(
  outletId: string,
  lookbackDays = 14,
): Promise<SalesForecast> {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date(end.getTime() - lookbackDays * 86400000));

  const orders = await prisma.order.findMany({
    where: {
      outletId,
      status: "paid",
      paidAt: { gte: start, lte: end },
    },
    select: { totalAmount: true, paidAt: true },
  });

  const daily = new Map<string, { sales: number; orders: number }>();
  for (const o of orders) {
    if (!o.paidAt) continue;
    const key = o.paidAt.toISOString().slice(0, 10);
    const row = daily.get(key) ?? { sales: 0, orders: 0 };
    row.sales += o.totalAmount;
    row.orders += 1;
    daily.set(key, row);
  }

  const days = [...daily.values()];
  const avgDailySales = days.length ? days.reduce((s, d) => s + d.sales, 0) / days.length : 0;
  const avgDailyOrders = days.length ? days.reduce((s, d) => s + d.orders, 0) / days.length : 0;

  const half = Math.max(1, Math.floor(days.length / 2));
  const firstHalf = days.slice(0, half);
  const secondHalf = days.slice(half);
  const firstAvg = firstHalf.length
    ? firstHalf.reduce((s, d) => s + d.sales, 0) / firstHalf.length
    : 0;
  const secondAvg = secondHalf.length
    ? secondHalf.reduce((s, d) => s + d.sales, 0) / secondHalf.length
    : 0;
  let trend: SalesForecast["trend"] = "stable";
  if (secondAvg > firstAvg * 1.05) trend = "up";
  else if (secondAvg < firstAvg * 0.95) trend = "down";

  return {
    basedOnDays: days.length || lookbackDays,
    avgDailySales: Math.round(avgDailySales),
    avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
    forecastNext7Days: {
      sales: Math.round(avgDailySales * 7),
      orders: Math.round(avgDailyOrders * 7),
    },
    forecastNext30Days: {
      sales: Math.round(avgDailySales * 30),
      orders: Math.round(avgDailyOrders * 30),
    },
    trend,
  };
}
