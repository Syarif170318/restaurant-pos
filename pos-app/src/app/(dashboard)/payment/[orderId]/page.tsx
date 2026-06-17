"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { CreditCard, Banknote, Printer, QrCode, Split } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  isPaid: boolean;
  menuItem: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  table: { tableNumber: string } | null;
  items: OrderItem[];
}

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "digital_wallet">("cash");
  const [loading, setLoading] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [receipt, setReceipt] = useState<{
    receiptNumber: string;
    change: number;
    fullyPaid: boolean;
    qrisReference?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrder(d.data);
          setAmountReceived(String(Math.ceil(d.data.totalAmount / 1000) * 1000));
        }
      });
  }, [orderId]);

  const unpaidItems = useMemo(
    () => order?.items.filter((i) => !i.isPaid) ?? [],
    [order],
  );

  const paySubtotal = useMemo(() => {
    if (!order) return 0;
    if (splitMode && selectedItems.length > 0) {
      return order.items
        .filter((i) => selectedItems.includes(i.id) && !i.isPaid)
        .reduce((s, i) => s + i.subtotal, 0);
    }
    return unpaidItems.reduce((s, i) => s + i.subtotal, 0);
  }, [order, splitMode, selectedItems, unpaidItems]);

  const payTotal = useMemo(() => {
    if (!order || paySubtotal === 0) return 0;
    const ratio = paySubtotal / (order.subtotal || 1);
    return Math.round(
      paySubtotal + order.taxAmount * ratio + order.serviceCharge * ratio,
    );
  }, [order, paySubtotal]);

  useEffect(() => {
    if (payTotal > 0) {
      setAmountReceived(String(Math.ceil(payTotal / 1000) * 1000));
    }
  }, [payTotal]);

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handlePayment() {
    if (!order) return;
    setLoading(true);

    const body: Record<string, unknown> = {
      orderId: order.id,
      paymentMethod: method,
      amountReceived: method === "cash" ? Number(amountReceived) : payTotal,
    };

    if (splitMode && selectedItems.length > 0) {
      body.itemIds = selectedItems;
    }

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setReceipt({
        receiptNumber: data.data.receiptNumber,
        change: data.data.changeAmount,
        fullyPaid: data.data.fullyPaid,
        qrisReference: data.data.qrisReference,
      });
      setOrder(data.data.order);
      if (!data.data.fullyPaid) {
        setSelectedItems([]);
        setSplitMode(false);
      }
    } else {
      alert(data.error);
    }
  }

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (receipt && receipt.fullyPaid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Printer className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Pembayaran Berhasil!</h2>
          <p className="mt-2 text-sm text-slate-500">Receipt: {receipt.receiptNumber}</p>
          {receipt.qrisReference && (
            <p className="mt-1 text-xs text-purple-600">Ref: {receipt.qrisReference}</p>
          )}
          {receipt.change > 0 && (
            <p className="mt-4 text-2xl font-bold text-blue-600">
              Kembalian: {formatCurrency(receipt.change)}
            </p>
          )}
          <div className="mt-6 space-y-2">
            <Button className="w-full" onClick={() => window.print()}>Cetak Struk</Button>
            <Button className="w-full" variant="secondary" onClick={() => router.push("/pos")}>
              Kembali ke POS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const change = Math.max(Number(amountReceived) - payTotal, 0);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pembayaran</h2>
            <p className="text-sm text-slate-500">
              {order.orderNumber}
              {order.table && ` — Meja ${order.table.tableNumber}`}
            </p>
          </div>
          <button
            onClick={() => { setSplitMode(!splitMode); setSelectedItems([]); }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              splitMode ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600",
            )}
          >
            <Split className="h-4 w-4" />
            Split Bill
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-slate-700">
              {splitMode ? "Pilih Item untuk Dibayar" : "Detail Order"}
            </h3>
            <div className="space-y-2">
              {(splitMode ? unpaidItems : order.items).map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm",
                    splitMode && selectedItems.includes(item.id) ? "border-purple-400 bg-purple-50" : "border-slate-100",
                    item.isPaid && "opacity-50",
                  )}
                >
                  {splitMode ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        disabled={item.isPaid}
                      />
                      <span>{item.quantity}x {item.menuItem.name}</span>
                    </div>
                  ) : (
                    <span>{item.quantity}x {item.menuItem.name}</span>
                  )}
                  <span className="flex items-center gap-2">
                    {formatCurrency(item.subtotal)}
                    {item.isPaid && <span className="text-xs text-green-600">Paid</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-lg font-bold text-blue-600">
                <span>{splitMode ? "Bayar Sekarang" : "Total"}</span>
                <span>{formatCurrency(payTotal)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-700">Metode Pembayaran</h3>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {([
                { key: "cash" as const, label: "Cash", icon: Banknote },
                { key: "card" as const, label: "Card", icon: CreditCard },
                { key: "digital_wallet" as const, label: "QRIS", icon: QrCode },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMethod(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border-2 p-3",
                    method === key ? "border-blue-500 bg-blue-50" : "border-slate-200",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>

            {method === "digital_wallet" && (
              <div className="mb-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-center">
                <QrCode className="mx-auto h-16 w-16 text-purple-600" />
                <p className="mt-2 text-sm font-medium text-purple-800">Scan QRIS</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(payTotal)}</p>
                <p className="mt-1 text-xs text-purple-600">Simulasi QRIS — klik bayar untuk konfirmasi</p>
              </div>
            )}

            {method === "cash" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Uang Diterima</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-medium"
                  />
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-sm text-slate-600">Kembalian</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(change)}</p>
                </div>
              </div>
            )}

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={handlePayment}
              disabled={
                loading ||
                payTotal === 0 ||
                (method === "cash" && Number(amountReceived) < payTotal) ||
                (splitMode && selectedItems.length === 0)
              }
            >
              {loading ? "Processing..." : `Bayar ${formatCurrency(payTotal)}`}
            </Button>
            <Button className="mt-2 w-full" variant="ghost" onClick={() => router.push("/pos")}>
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
