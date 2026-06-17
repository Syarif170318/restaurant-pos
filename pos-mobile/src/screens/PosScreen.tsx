import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { api, formatCurrency, syncOfflineQueue, offlineQueueSize } from "../lib/api";
import { clearSession, getUser } from "../lib/auth";
import { ModifierModal } from "../components/ModifierModal";

interface Table {
  id: string;
  tableNumber: string;
  status: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  modifiers: Array<{ id: string; name: string; extraPrice: number }>;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface OrderItem {
  id: string;
  quantity: number;
  subtotal: number;
  notes: string | null;
  menuItem: { name: string };
  modifiers: Array<{ modifier: { name: string }; extraPrice: number }>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  table: { tableNumber: string } | null;
}

interface Props {
  onPayment: (orderId: string) => void;
  onOrders: () => void;
  onCloseShift: () => void;
  onLogout: () => void;
}

export function PosScreen({ onPayment, onOrders, onCloseShift, onLogout }: Props) {
  const [userName, setUserName] = useState("");
  const [outletLabel, setOutletLabel] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState("");
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingCash, setClosingCash] = useState("");
  const [queueSize, setQueueSize] = useState(0);

  const load = useCallback(async () => {
    const [t, m] = await Promise.all([
      api<Table[]>("/api/tables"),
      api<Category[]>("/api/menu/categories"),
    ]);
    if (t.success && t.data) setTables(t.data);
    if (m.success && m.data) {
      setCategories(m.data);
      if (m.data[0] && !activeCat) setActiveCat(m.data[0].id);
    }
  }, [activeCat]);

  useEffect(() => {
    getUser().then((u) => {
      if (u) {
        setUserName(u.fullName);
        if (u.outletName) {
          setOutletLabel(u.outletCode ? `${u.outletName} (${u.outletCode})` : u.outletName);
        }
      }
    });
    load();
    offlineQueueSize().then(setQueueSize);
  }, [load]);

  async function syncQueue() {
    const n = await syncOfflineQueue();
    const remaining = await offlineQueueSize();
    setQueueSize(remaining);
    Alert.alert("Sync", n > 0 ? `${n} request disinkronkan` : "Tidak ada data offline");
  }

  async function holdOrder() {
    if (!order) return;
    const res = await api(`/api/orders/${order.id}/hold`, {
      method: "POST",
      body: JSON.stringify({ hold: true }),
    });
    if (res.success) {
      Alert.alert("Hold", "Order disimpan. Buat order baru.");
      setOrder(null);
      load();
    } else Alert.alert("Error", res.error);
  }

  async function createOrder() {
    if (orderType === "dine_in" && !selectedTable) {
      Alert.alert("Pilih Meja", "Pilih meja untuk dine-in");
      return;
    }
    const res = await api<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        orderType,
        tableId: orderType === "dine_in" ? selectedTable : null,
        items: [],
      }),
    });
    if (res.success && res.data) {
      setOrder(res.data);
      load();
    } else Alert.alert("Error", res.error);
  }

  function handleItemPress(item: MenuItem) {
    if (!order) {
      Alert.alert("Buat Order", "Buat order baru dulu");
      return;
    }
    if (!item.isAvailable) return;
    if (item.modifiers.length > 0) {
      setPickerItem(item);
    } else {
      addItem(item.id);
    }
  }

  async function addItem(menuItemId: string, modifierIds: string[] = [], notes = "") {
    if (!order) return;
    const res = await api<Order>(`/api/orders/${order.id}`, {
      method: "POST",
      body: JSON.stringify({ menuItemId, quantity: 1, modifierIds, notes }),
    });
    if (res.success && res.data) setOrder(res.data);
    else Alert.alert("Error", res.error);
  }

  async function removeItem(itemId: string) {
    if (!order) return;
    const res = await api<Order>(`/api/orders/${order.id}/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.success && res.data) setOrder(res.data);
  }

  async function confirmOrder() {
    if (!order || order.items.length === 0) return;
    const res = await api<Order>(`/api/orders/${order.id}/confirm`, { method: "POST" });
    if (res.success && res.data) {
      setOrder(res.data);
      Alert.alert("Sukses", "Dikirim ke dapur!");
      load();
    } else Alert.alert("Error", res.error);
  }

  async function voidOrder() {
    if (!order) return;
    Alert.alert("Void Order", "Batalkan order ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Void",
        style: "destructive",
        onPress: async () => {
          const res = await api(`/api/orders/${order.id}/void`, {
            method: "POST",
            body: JSON.stringify({ reason: "Void by cashier" }),
          });
          if (res.success) {
            setOrder(null);
            load();
          } else Alert.alert("Error", res.error);
        },
      },
    ]);
  }

  async function submitCloseShift() {
    const res = await api("/api/shifts", {
      method: "POST",
      body: JSON.stringify({
        action: "close",
        closingCash: Number(closingCash) || 0,
      }),
    });
    if (res.success) {
      setShowCloseModal(false);
      onCloseShift();
    } else Alert.alert("Error", res.error);
  }

  async function handleLogout() {
    await clearSession();
    onLogout();
  }

  const menuItems = categories.find((c) => c.id === activeCat)?.items ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Restaurant POS</Text>
          <Text style={styles.headerSub}>{userName}</Text>
          {outletLabel ? <Text style={styles.headerOutlet}>{outletLabel}</Text> : null}
        </View>
        <View style={styles.headerActions}>
          {queueSize > 0 && (
            <TouchableOpacity onPress={syncQueue} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Sync ({queueSize})</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onOrders} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCloseModal(true)} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Tutup Shift</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.typeRow}>
        {(["dine_in", "takeaway"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, orderType === t && styles.typeActive]}
            onPress={() => setOrderType(t)}
          >
            <Text style={[styles.typeText, orderType === t && styles.typeTextActive]}>
              {t === "dine_in" ? "Dine-in" : "Takeaway"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {orderType === "dine_in" && (
        <ScrollView horizontal style={styles.tableRow} showsHorizontalScrollIndicator={false}>
          {tables.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.tableBtn,
                t.status === "occupied" && styles.tableOccupied,
                selectedTable === t.id && styles.tableSelected,
              ]}
              onPress={() => setSelectedTable(t.id)}
            >
              <Text style={styles.tableNum}>{t.tableNumber}</Text>
              <Text style={styles.tableStatus}>{t.status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {!order ? (
        <TouchableOpacity style={styles.createBtn} onPress={createOrder}>
          <Text style={styles.createBtnText}>+ Order Baru</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.orderBar}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <View style={styles.orderBarRight}>
            <Text style={[styles.statusBadge, order.status === "draft" && styles.statusDraft]}>
              {order.status}
            </Text>
            <Text style={styles.orderTotal}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>
      )}

      <ScrollView horizontal style={styles.catRow} showsHorizontalScrollIndicator={false}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.catBtn, activeCat === c.id && styles.catActive]}
            onPress={() => setActiveCat(c.id)}
          >
            <Text style={[styles.catText, activeCat === c.id && styles.catTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={menuItems}
        numColumns={2}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.menuGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.menuItem, !item.isAvailable && styles.menuSoldOut]}
            onPress={() => handleItemPress(item)}
            disabled={!order || !item.isAvailable}
          >
            <Text style={styles.menuName}>{item.name}</Text>
            <Text style={styles.menuPrice}>{formatCurrency(item.price)}</Text>
            {item.modifiers.length > 0 && (
              <Text style={styles.modHint}>+ opsi</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {order && (
        <View style={styles.footer}>
          <ScrollView style={styles.footerScroll} nestedScrollEnabled>
            {order.items.map((i) => (
              <View key={i.id} style={styles.footerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.footerItem}>
                    {i.quantity}x {i.menuItem.name} — {formatCurrency(i.subtotal)}
                  </Text>
                  {i.modifiers?.map((m) => (
                    <Text key={m.modifier.name} style={styles.modTag}>+ {m.modifier.name}</Text>
                  ))}
                  {i.notes && <Text style={styles.noteTag}>{i.notes}</Text>}
                </View>
                {order.status === "draft" && (
                  <TouchableOpacity onPress={() => removeItem(i.id)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {order.status === "draft" && (
            <>
              <TouchableOpacity style={styles.holdBtn} onPress={holdOrder}>
                <Text style={styles.confirmText}>Hold / Simpan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmOrder}>
                <Text style={styles.confirmText}>Konfirmasi → Kitchen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voidBtn} onPress={voidOrder}>
                <Text style={styles.voidText}>Void Order</Text>
              </TouchableOpacity>
            </>
          )}
          {["confirmed", "preparing", "ready", "served"].includes(order.status) && (
            <TouchableOpacity style={styles.payBtn} onPress={() => onPayment(order.id)}>
              <Text style={styles.confirmText}>Bayar {formatCurrency(order.totalAmount)}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setOrder(null)}>
            <Text style={styles.newOrder}>+ Order Baru</Text>
          </TouchableOpacity>
        </View>
      )}

      <ModifierModal
        visible={!!pickerItem}
        itemName={pickerItem?.name ?? ""}
        basePrice={pickerItem?.price ?? 0}
        modifiers={pickerItem?.modifiers ?? []}
        onConfirm={(ids, notes) => {
          if (pickerItem) addItem(pickerItem.id, ids, notes);
          setPickerItem(null);
        }}
        onCancel={() => setPickerItem(null)}
      />

      <Modal visible={showCloseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tutup Shift</Text>
            <Text style={styles.modalDesc}>
              Hitung uang di laci kasir dan masukkan jumlah fisik.
            </Text>
            <Text style={styles.modalLabel}>Uang Fisik di Laci (Rp)</Text>
            <TextInput
              style={styles.modalInput}
              value={closingCash}
              onChangeText={setClosingCash}
              keyboardType="numeric"
              placeholder="0"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowCloseModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOk} onPress={submitCloseShift}>
                <Text style={styles.modalOkText}>Tutup Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#2563eb",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "#bfdbfe", fontSize: 12 },
  headerOutlet: { color: "#e9d5ff", fontSize: 11, marginTop: 2 },
  headerActions: { alignItems: "flex-end", gap: 6 },
  headerBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  headerBtnText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  logout: { color: "#bfdbfe", fontSize: 12 },
  typeRow: { flexDirection: "row", padding: 10, gap: 8 },
  typeBtn: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: "#e2e8f0", alignItems: "center" },
  typeActive: { backgroundColor: "#2563eb" },
  typeText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  typeTextActive: { color: "#fff" },
  tableRow: { paddingHorizontal: 12, maxHeight: 72 },
  tableBtn: {
    width: 60, height: 52, marginRight: 8, borderRadius: 10,
    backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#86efac",
  },
  tableOccupied: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  tableSelected: { borderColor: "#2563eb" },
  tableNum: { fontWeight: "bold", fontSize: 15 },
  tableStatus: { fontSize: 8, textTransform: "capitalize" },
  createBtn: { margin: 12, backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  createBtnText: { color: "#fff", fontWeight: "600" },
  orderBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#eff6ff",
  },
  orderNum: { fontWeight: "600", color: "#1e40af" },
  orderBarRight: { alignItems: "flex-end" },
  statusBadge: { fontSize: 10, color: "#64748b", textTransform: "capitalize" },
  statusDraft: { color: "#d97706" },
  orderTotal: { fontWeight: "bold", color: "#2563eb" },
  catRow: { paddingHorizontal: 12, maxHeight: 40 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderRadius: 20, backgroundColor: "#e2e8f0" },
  catActive: { backgroundColor: "#2563eb" },
  catText: { color: "#475569", fontSize: 12 },
  catTextActive: { color: "#fff" },
  menuGrid: { padding: 6 },
  menuItem: {
    flex: 1, margin: 5, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#e2e8f0", minWidth: "46%",
  },
  menuSoldOut: { opacity: 0.4 },
  menuName: { fontWeight: "600", fontSize: 13 },
  menuPrice: { color: "#2563eb", marginTop: 3, fontSize: 12 },
  modHint: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  footer: { borderTopWidth: 1, borderColor: "#e2e8f0", padding: 10, backgroundColor: "#fff", maxHeight: 200 },
  footerScroll: { maxHeight: 80 },
  footerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  footerItem: { fontSize: 12, color: "#475569" },
  modTag: { fontSize: 10, color: "#ea580c" },
  noteTag: { fontSize: 10, color: "#94a3b8", fontStyle: "italic" },
  removeBtn: { color: "#ef4444", fontSize: 16, paddingHorizontal: 8 },
  holdBtn: { backgroundColor: "#ca8a04", padding: 12, borderRadius: 10, marginTop: 6 },
  confirmBtn: { backgroundColor: "#16a34a", padding: 12, borderRadius: 10, marginTop: 6 },
  voidBtn: { backgroundColor: "#fef2f2", padding: 10, borderRadius: 10, marginTop: 4 },
  voidText: { color: "#ef4444", textAlign: "center", fontWeight: "600", fontSize: 13 },
  payBtn: { backgroundColor: "#7c3aed", padding: 12, borderRadius: 10, marginTop: 6 },
  confirmText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  newOrder: { textAlign: "center", color: "#64748b", marginTop: 8, fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  modalDesc: { color: "#64748b", marginTop: 6, marginBottom: 16, lineHeight: 20 },
  modalLabel: { color: "#475569", fontSize: 14, marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  modalCancelText: { color: "#64748b", fontWeight: "600" },
  modalOk: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    alignItems: "center",
  },
  modalOkText: { color: "#fff", fontWeight: "600" },
});
