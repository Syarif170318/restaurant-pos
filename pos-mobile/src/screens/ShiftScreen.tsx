import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { api } from "../lib/api";
import { clearSession, getUser } from "../lib/auth";

interface Props {
  onShiftReady: () => void;
  onLogout: () => void;
}

export function ShiftScreen({ onShiftReady, onLogout }: Props) {
  const [userName, setUserName] = useState("");
  const [outletLabel, setOutletLabel] = useState("");
  const [openingCash, setOpeningCash] = useState("500000");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser().then((u) => {
      if (u) {
        setUserName(u.fullName);
        if (u.outletName) {
          setOutletLabel(u.outletCode ? `${u.outletName} (${u.outletCode})` : u.outletName);
        }
      }
    });
    setLoading(false);
  }, []);

  async function openShift() {
    const res = await api<{ id: string }>("/api/shifts", {
      method: "POST",
      body: JSON.stringify({ action: "open", openingCash: Number(openingCash) }),
    });
    if (res.success && res.data) {
      onShiftReady();
    } else {
      Alert.alert("Error", res.error);
    }
  }

  async function handleLogout() {
    await clearSession();
    onLogout();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buka Shift</Text>
        <Text style={styles.headerSub}>{userName}</Text>
        {outletLabel ? <Text style={styles.headerOutlet}>{outletLabel}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.emoji}>💰</Text>
        <Text style={styles.cardTitle}>Mulai Shift Kasir</Text>
        <Text style={styles.cardDesc}>
          Masukkan modal awal di laci kasir sebelum menerima order.
        </Text>

        <Text style={styles.label}>Modal Awal (Rp)</Text>
        <TextInput
          style={styles.input}
          value={openingCash}
          onChangeText={setOpeningCash}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.openBtn} onPress={openShift}>
          <Text style={styles.openText}>Buka Shift & Mulai POS</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: "#2563eb",
    padding: 24,
    paddingTop: 48,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerSub: { color: "#bfdbfe", marginTop: 4 },
  headerOutlet: { color: "#e9d5ff", fontSize: 12, marginTop: 2 },
  card: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  cardDesc: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: { alignSelf: "stretch", color: "#475569", marginBottom: 6, fontSize: 14 },
  input: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 20,
  },
  openBtn: {
    alignSelf: "stretch",
    backgroundColor: "#16a34a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  openText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  logoutBtn: { alignItems: "center", marginTop: 16 },
  logoutText: { color: "#94a3b8" },
});
