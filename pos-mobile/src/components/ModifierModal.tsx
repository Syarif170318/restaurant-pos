import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from "react-native";
import { formatCurrency } from "../lib/api";

interface Modifier {
  id: string;
  name: string;
  extraPrice: number;
}

interface Props {
  visible: boolean;
  itemName: string;
  basePrice: number;
  modifiers: Modifier[];
  onConfirm: (modifierIds: string[], notes: string) => void;
  onCancel: () => void;
}

export function ModifierModal({
  visible,
  itemName,
  basePrice,
  modifiers,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (visible) {
      setSelected([]);
      setNotes("");
    }
  }, [visible, itemName]);

  const extra = modifiers
    .filter((m) => selected.includes(m.id))
    .reduce((s, m) => s + m.extraPrice, 0);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleConfirm() {
    onConfirm(selected, notes);
    setSelected([]);
    setNotes("");
  }

  function handleCancel() {
    setSelected([]);
    setNotes("");
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{itemName}</Text>
          <Text style={styles.price}>Base: {formatCurrency(basePrice)}</Text>

          {modifiers.length > 0 && (
            <ScrollView style={styles.modList}>
              {modifiers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modRow, selected.includes(m.id) && styles.modSelected]}
                  onPress={() => toggle(m.id)}
                >
                  <Text style={styles.modName}>{m.name}</Text>
                  {m.extraPrice > 0 && (
                    <Text style={styles.modExtra}>+{formatCurrency(m.extraPrice)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TextInput
            style={styles.notes}
            placeholder="Catatan (opsional)"
            value={notes}
            onChangeText={setNotes}
          />

          <Text style={styles.total}>Total: {formatCurrency(basePrice + extra)}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={handleConfirm}>
              <Text style={styles.okText}>Tambah</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  price: { color: "#64748b", marginBottom: 12 },
  modList: { maxHeight: 160, marginBottom: 12 },
  modRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  modSelected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  modName: { fontSize: 14, color: "#334155" },
  modExtra: { fontSize: 13, color: "#2563eb" },
  notes: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  total: {
    textAlign: "right",
    fontWeight: "bold",
    color: "#2563eb",
    fontSize: 16,
    marginBottom: 16,
  },
  actions: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelText: { color: "#64748b", fontWeight: "600" },
  okBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  okText: { color: "#fff", fontWeight: "600" },
});
