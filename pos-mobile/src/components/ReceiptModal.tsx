import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

interface Props {
  visible: boolean;
  text: string;
  onClose: () => void;
}

export function ReceiptModal({ visible, text, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Struk Pembayaran</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.receipt}>{text}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Tutup</Text>
          </TouchableOpacity>
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
  box: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  scroll: { maxHeight: 400, marginBottom: 16 },
  receipt: { fontFamily: "monospace", fontSize: 12, lineHeight: 18, color: "#0f172a" },
  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
