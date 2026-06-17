import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { api } from "../lib/api";
import { saveSession, type User } from "../lib/auth";

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState("kasir1");
  const [pin, setPin] = useState("1111");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await api<{
        id: string;
        username: string;
        fullName: string;
        role: string;
        outletId: string;
        token: string;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, pin }),
      });

      if (!res.success || !res.data?.token) {
        Alert.alert("Login Gagal", res.error ?? "Invalid credentials");
        return;
      }

      if (!["cashier", "waiter", "admin", "manager"].includes(res.data.role)) {
        Alert.alert("Akses Ditolak", "Mobile app hanya untuk Kasir/Waiter");
        return;
      }

      const { token, ...profile } = res.data;
      const user: User = { ...profile };
      const me = await api<{
        outlet?: { name: string; code: string | null };
      }>("/api/auth/me");
      if (me.success && me.data?.outlet) {
        user.outletName = me.data.outlet.name;
        user.outletCode = me.data.outlet.code ?? undefined;
      }

      await saveSession(token, user);
      onLogin();
    } catch {
      Alert.alert("Error", "Tidak bisa connect ke server. Pastikan pos-app jalan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant POS Mobile</Text>
      <Text style={styles.subtitle}>Kasir & Waiter</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Masuk</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Demo: kasir1 / PIN 1111</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" },
  title: { fontSize: 28, fontWeight: "bold", color: "#1e40af", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 32 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hint: { textAlign: "center", color: "#94a3b8", marginTop: 16, fontSize: 12 },
});
