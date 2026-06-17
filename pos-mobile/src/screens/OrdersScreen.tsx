import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { api, formatCurrency } from "../lib/api";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  table: { tableNumber: string } | null;
  orderType: string;
  source?: string;
  customerName?: string | null;
}

interface Props {
  onSelect: (orderId: string) => void;
  onBack: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Di Dapur",
  preparing: "Memasak",
  ready: "Siap",
  served: "Siap Bayar",
};

export function OrdersScreen({ onSelect, onBack }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const statuses = ["confirmed", "preparing", "ready", "served"];
    const results = await Promise.all(
      statuses.map((s) => api<Order[]>(`/api/orders?status=${s}`)),
    );
    const all: Order[] = [];
    for (const r of results) {
      if (r.success && r.data) all.push(...r.data);
    }
    setOrders(all);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order Aktif</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Tidak ada order aktif</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item.id)}>
            <View>
              <Text style={styles.orderNum}>{item.orderNumber}</Text>
              <Text style={styles.meta}>
                {item.orderType === "takeaway"
                  ? "Takeaway"
                  : `Meja ${item.table?.tableNumber}`}
                {item.source === "qr_menu" ? " · QR Menu" : ""}
                {item.customerName ? ` · ${item.customerName}` : ""}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.badge, item.status === "served" && styles.badgeReady]}>
                {STATUS_LABEL[item.status] ?? item.status}
              </Text>
              <Text style={styles.total}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#2563eb",
    gap: 12,
  },
  back: { color: "#bfdbfe", fontSize: 14 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  orderNum: { fontWeight: "bold", fontSize: 15, color: "#0f172a" },
  meta: { color: "#64748b", fontSize: 12, marginTop: 2 },
  right: { alignItems: "flex-end" },
  badge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeReady: { backgroundColor: "#dcfce7", color: "#166534" },
  total: { fontWeight: "bold", color: "#2563eb", marginTop: 6 },
});
