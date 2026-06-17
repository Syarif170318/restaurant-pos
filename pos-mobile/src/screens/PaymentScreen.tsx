import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { api, fetchText, formatCurrency } from "../lib/api";
import { ReceiptModal } from "../components/ReceiptModal";

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
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  items: OrderItem[];
}

interface Customer {
  id: string;
  phone: string;
  name: string;
  loyaltyPoints: number;
}

interface Props {
  orderId: string;
  onDone: () => void;
  onBack: () => void;
}

export function PaymentScreen({ orderId, onDone, onBack }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<"cash" | "card" | "digital_wallet">("cash");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [redeemValue, setRedeemValue] = useState(100);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [receiptText, setReceiptText] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    api<Order>(`/api/orders/${orderId}`).then((res) => {
      if (res.success && res.data) {
        setOrder(res.data);
        setAmount(String(Math.ceil(res.data.totalAmount / 1000) * 1000));
      }
    });
  }, [orderId]);

  const unpaid = useMemo(() => order?.items.filter((i) => !i.isPaid) ?? [], [order]);

  const paySubtotal = useMemo(() => {
    if (!order) return 0;
    const items =
      splitMode && selected.length > 0
        ? order.items.filter((i) => selected.includes(i.id) && !i.isPaid)
        : unpaid;
    return items.reduce((s, i) => s + i.subtotal, 0);
  }, [order, splitMode, selected, unpaid]);

  const loyaltyDiscount = useMemo(() => {
    if (splitMode || redeemPoints <= 0) return 0;
    return Math.min(redeemPoints * redeemValue, paySubtotal);
  }, [splitMode, redeemPoints, redeemValue, paySubtotal]);

  const payTotal = useMemo(() => {
    if (!order || paySubtotal === 0) return 0;
    const taxable = Math.max(paySubtotal - loyaltyDiscount, 0);
    const ratio = taxable / (order.subtotal || 1);
    return Math.round(taxable + order.taxAmount * ratio + order.serviceCharge * ratio);
  }, [order, paySubtotal, loyaltyDiscount]);

  useEffect(() => {
    if (payTotal > 0) setAmount(String(Math.ceil(payTotal / 1000) * 1000));
  }, [payTotal]);

  async function lookupCustomer() {
    if (!phone.trim()) return;
    const res = await api<{
      customer: Customer;
      settings: { pointsPerAmount: number; redeemValue: number };
    }>(`/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`);
    if (res.success && res.data) {
      setCustomer(res.data.customer);
      setRedeemValue(res.data.settings.redeemValue);
      setRedeemPoints(0);
    } else {
      Alert.alert("Tidak ditemukan", res.error ?? "Pelanggan belum terdaftar");
      setCustomer(null);
    }
  }

  function toggleItem(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function showReceiptForOrder(id: string) {
    const text = await fetchText(`/api/orders/${id}/receipt`);
    if (text) {
      setReceiptText(text);
      setShowReceipt(true);
    } else {
      Alert.alert("Error", "Gagal memuat struk");
    }
  }

  async function pay() {
    if (!order) return;
    setLoading(true);

    const body: Record<string, unknown> = {
      orderId: order.id,
      paymentMethod: method,
      amountReceived: method === "cash" ? Number(amount) : payTotal,
    };
    if (splitMode && selected.length > 0) body.itemIds = selected;
    if (customer && !splitMode) {
      body.customerPhone = customer.phone;
      body.customerName = customer.name;
      if (redeemPoints > 0) body.redeemPoints = redeemPoints;
    }

    const res = await api<{
      receiptNumber: string;
      changeAmount: number;
      fullyPaid: boolean;
      qrisReference?: string;
    }>("/api/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (res.success && res.data) {
      const msg = [
        `Receipt: ${res.data.receiptNumber}`,
        res.data.changeAmount > 0 ? `Kembalian: ${formatCurrency(res.data.changeAmount)}` : "",
        res.data.qrisReference ? `Ref: ${res.data.qrisReference}` : "",
        loyaltyDiscount > 0 ? `Diskon loyalty: ${formatCurrency(loyaltyDiscount)}` : "",
        !res.data.fullyPaid ? "Masih ada item belum dibayar" : "",
      ]
        .filter(Boolean)
        .join("\n");

      if (res.data.fullyPaid) {
        Alert.alert("Pembayaran Berhasil", msg, [
          { text: "Lihat Struk", onPress: () => showReceiptForOrder(orderId) },
          { text: "Selesai", onPress: onDone },
        ]);
      } else {
        Alert.alert("Pembayaran Berhasil", msg, [
          {
            text: "OK",
            onPress: () => {
              setSelected([]);
              setSplitMode(false);
              setRedeemPoints(0);
              api<Order>(`/api/orders/${orderId}`).then((r) => {
                if (r.success && r.data) setOrder(r.data);
              });
            },
          },
        ]);
      }
    } else {
      Alert.alert("Error", res.error);
    }
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const change = Math.max(Number(amount) - payTotal, 0);
  const displayItems = splitMode ? unpaid : order.items;
  const maxRedeem = customer
    ? Math.min(customer.loyaltyPoints, Math.floor(paySubtotal / redeemValue))
    : 0;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pembayaran</Text>
        <Text style={styles.orderNum}>{order.orderNumber}</Text>

        <TouchableOpacity
          style={[styles.splitToggle, splitMode && styles.splitActive]}
          onPress={() => {
            setSplitMode(!splitMode);
            setSelected([]);
            setRedeemPoints(0);
          }}
        >
          <Text style={[styles.splitText, splitMode && styles.splitTextActive]}>
            {splitMode ? "✓ Split Bill" : "Split Bill"}
          </Text>
        </TouchableOpacity>

        {!splitMode && (
          <View style={styles.loyaltyBox}>
            <Text style={styles.loyaltyTitle}>Loyalty (opsional)</Text>
            <View style={styles.phoneRow}>
              <TextInput
                style={styles.phoneInput}
                placeholder="No. HP pelanggan"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.lookupBtn} onPress={lookupCustomer}>
                <Text style={styles.lookupText}>Cari</Text>
              </TouchableOpacity>
            </View>
            {customer && (
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>
                  {customer.name} · {customer.loyaltyPoints} poin
                </Text>
                {maxRedeem > 0 && (
                  <View style={styles.redeemRow}>
                    <Text style={styles.redeemLabel}>Tukar poin:</Text>
                    {[0, Math.min(10, maxRedeem), Math.min(50, maxRedeem), maxRedeem]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((pts) => (
                        <TouchableOpacity
                          key={pts}
                          style={[styles.redeemChip, redeemPoints === pts && styles.redeemChipActive]}
                          onPress={() => setRedeemPoints(pts)}
                        >
                          <Text
                            style={
                              redeemPoints === pts ? styles.redeemChipTextActive : styles.redeemChipText
                            }
                          >
                            {pts === 0 ? "Tidak" : `${pts} (-${formatCurrency(pts * redeemValue)})`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {displayItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, splitMode && selected.includes(item.id) && styles.itemSelected]}
            onPress={() => splitMode && !item.isPaid && toggleItem(item.id)}
            disabled={!splitMode || item.isPaid}
          >
            <Text style={styles.item}>
              {splitMode && !item.isPaid ? (selected.includes(item.id) ? "☑ " : "☐ ") : ""}
              {item.quantity}x {item.menuItem.name}
            </Text>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.subtotal)}
              {item.isPaid && " ✓"}
            </Text>
          </TouchableOpacity>
        ))}

        {loyaltyDiscount > 0 && (
          <Text style={styles.discount}>Diskon loyalty: -{formatCurrency(loyaltyDiscount)}</Text>
        )}
        <Text style={styles.total}>Bayar: {formatCurrency(payTotal)}</Text>

        <View style={styles.methodRow}>
          {(["cash", "card", "digital_wallet"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodActive]}
              onPress={() => setMethod(m)}
            >
              <Text style={method === m ? styles.methodTextActive : styles.methodText}>
                {m === "digital_wallet" ? "QRIS" : m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {method === "cash" && (
          <>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <Text style={styles.change}>Kembalian: {formatCurrency(change)}</Text>
          </>
        )}

        {method === "digital_wallet" && (
          <View style={styles.qrisBox}>
            <Text style={styles.qrisEmoji}>📱</Text>
            <Text style={styles.qrisText}>Scan QRIS</Text>
            <Text style={styles.qrisAmount}>{formatCurrency(payTotal)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.payBtn}
          onPress={pay}
          disabled={
            loading ||
            payTotal === 0 ||
            (method === "cash" && Number(amount) < payTotal) ||
            (splitMode && selected.length === 0)
          }
        >
          <Text style={styles.payText}>
            {loading ? "Processing..." : `Bayar ${formatCurrency(payTotal)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
      </ScrollView>

      <ReceiptModal
        visible={showReceipt}
        text={receiptText}
        onClose={() => {
          setShowReceipt(false);
          onDone();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold" },
  orderNum: { color: "#64748b", marginBottom: 12 },
  splitToggle: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    marginBottom: 12,
  },
  splitActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  splitText: { color: "#7c3aed", fontSize: 13, fontWeight: "600" },
  splitTextActive: { color: "#fff" },
  loyaltyBox: {
    backgroundColor: "#fdf2f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  loyaltyTitle: { fontSize: 13, fontWeight: "600", color: "#be185d", marginBottom: 8 },
  phoneRow: { flexDirection: "row", gap: 8 },
  phoneInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  lookupBtn: {
    backgroundColor: "#db2777",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  lookupText: { color: "#fff", fontWeight: "600" },
  customerInfo: { marginTop: 10 },
  customerName: { fontSize: 14, fontWeight: "600", color: "#831843" },
  redeemRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" },
  redeemLabel: { fontSize: 12, color: "#9d174d" },
  redeemChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f9a8d4",
    backgroundColor: "#fff",
  },
  redeemChipActive: { backgroundColor: "#db2777", borderColor: "#db2777" },
  redeemChipText: { fontSize: 11, color: "#be185d" },
  redeemChipTextActive: { fontSize: 11, color: "#fff", fontWeight: "600" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemSelected: { backgroundColor: "#faf5ff" },
  item: { fontSize: 14, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: "500" },
  discount: { fontSize: 14, color: "#db2777", fontWeight: "600" },
  total: { fontSize: 22, fontWeight: "bold", color: "#2563eb", marginVertical: 16 },
  methodRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  methodBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  methodActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  methodText: { color: "#64748b", fontSize: 11, fontWeight: "600" },
  methodTextActive: { color: "#2563eb", fontSize: 11, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginBottom: 8,
  },
  change: { textAlign: "center", color: "#2563eb", fontWeight: "600", marginBottom: 16 },
  qrisBox: {
    backgroundColor: "#faf5ff",
    borderWidth: 2,
    borderColor: "#c4b5fd",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  qrisEmoji: { fontSize: 40 },
  qrisText: { color: "#7c3aed", fontWeight: "600", marginTop: 8 },
  qrisAmount: { color: "#7c3aed", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  payBtn: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, marginBottom: 12 },
  payText: { color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 16 },
  back: { textAlign: "center", color: "#64748b", marginBottom: 24 },
});
