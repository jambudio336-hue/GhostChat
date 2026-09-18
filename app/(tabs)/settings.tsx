import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const WA = "6285262965282";
const themes = ["Midnight", "Crimson", "Graphite"];

export default function SettingsScreen() {
  const [autoDelete, setAutoDelete] = useState(true);
  const [readReceipt, setReadReceipt] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("Midnight");
  const [notifications, setNotifications] = useState(true);

  const whatsapp = async (text: string) => Linking.openURL(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`);

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}><View><Text style={styles.kicker}>GHOSTCHAT</Text><Text style={styles.title}>Settings</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>G</Text></View></View>
      <View style={styles.profileCard}><View style={styles.profileIcon}><MaterialIcons name="shield" size={24} color="#ff3355" /></View><View style={{ flex: 1 }}><Text style={styles.profileTitle}>Mode anonim aktif</Text><Text style={styles.profileSub}>Tidak ada akun · device-only identity</Text></View><View style={styles.activePill}><Text style={styles.activeText}>AKTIF</Text></View></View>
      <Text style={styles.section}>TAMPILAN CHAT</Text>
      <View style={styles.card}><Text style={styles.rowTitle}>Latar belakang chat</Text><Text style={styles.rowSub}>Pilih nuansa untuk percakapanmu</Text><View style={styles.themeRow}>{themes.map((theme) => <Pressable key={theme} onPress={() => setSelectedTheme(theme)} style={[styles.themeOption, selectedTheme === theme && styles.themeSelected]}><View style={[styles.themeSwatch, theme === "Midnight" ? styles.midnight : theme === "Crimson" ? styles.crimson : styles.graphite]} /> <Text style={[styles.themeText, selectedTheme === theme && styles.themeTextActive]}>{theme}</Text>{selectedTheme === theme && <MaterialIcons name="check" size={16} color="#ff3355" />}</Pressable>)}</View></View>
      <Text style={styles.section}>PRIVASI & NOTIFIKASI</Text>
      <View style={styles.card}>
        <SettingRow icon="delete-sweep" title="Hapus riwayat otomatis" subtitle="Pesan hilang setelah 5 menit" value={autoDelete} onChange={setAutoDelete} />
        <SettingRow icon="visibility-off" title="Sembunyikan tanda dibaca" subtitle="Jaga status online tetap privat" value={readReceipt} onChange={setReadReceipt} />
        <SettingRow icon="notifications-none" title="Notifikasi pesan" subtitle="Terima notifikasi dari partner" value={notifications} onChange={setNotifications} last />
      </View>
      <Text style={styles.section}>DUKUNGAN</Text>
      <View style={styles.card}>
        <Pressable style={styles.linkRow} onPress={() => whatsapp("Halo GhostChat, saya ingin memberikan rating: ")}><View style={styles.linkIcon}><MaterialIcons name="star-border" size={20} color="#ffb83e" /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Beri rating GhostChat</Text><Text style={styles.rowSub}>Kirim rating langsung ke WhatsApp</Text></View><MaterialIcons name="chevron-right" size={22} color="#6e7582" /></Pressable>
        <Pressable style={styles.linkRow} onPress={() => whatsapp("Halo GhostChat, saya ingin melaporkan bug: ")}><View style={styles.linkIcon}><MaterialIcons name="bug-report" size={20} color="#ff4968" /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Laporkan bug</Text><Text style={styles.rowSub}>Bantu kami membuat aplikasi lebih aman</Text></View><MaterialIcons name="chevron-right" size={22} color="#6e7582" /></Pressable>
        <Pressable style={styles.linkRow} onPress={() => Alert.alert("GhostChat", "GhostChat v1.0.0\nBy. MR.K1pl4y\n\nPrivate messaging tanpa akun dengan pairing antar-perangkat.")}><View style={styles.linkIcon}><MaterialIcons name="info-outline" size={20} color="#9ba2af" /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Tentang aplikasi</Text><Text style={styles.rowSub}>GhostChat v1.0.0 · By. MR.K1pl4y</Text></View><MaterialIcons name="chevron-right" size={22} color="#6e7582" /></Pressable>
      </View>
      <Text style={styles.footer}>Koneksi terenkripsi end-to-end · GhostChat</Text>
    </ScrollView>
  </ScreenContainer>;
}

function SettingRow({ icon, title, subtitle, value, onChange, last }: { icon: any; title: string; subtitle: string; value: boolean; onChange: (value: boolean) => void; last?: boolean }) {
  return <View style={[styles.settingRow, !last && styles.rowBorder]}><View style={styles.settingIcon}><MaterialIcons name={icon} size={20} color="#ff4968" /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSub}>{subtitle}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: "#363b46", true: "#742138" }} thumbColor={value ? "#ff4968" : "#969daa"} /></View>;
}

const styles = StyleSheet.create({ container: { padding: 18, paddingBottom: 32 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }, kicker: { color: "#ff3355", fontSize: 9, letterSpacing: 2.5, fontWeight: "800" }, title: { color: "#f5f6f8", fontSize: 30, fontWeight: "800", marginTop: 5 }, avatar: { width: 41, height: 41, borderRadius: 14, backgroundColor: "#ff3355", alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 20, fontWeight: "900", color: "#180b0e" }, profileCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, backgroundColor: "#1a1c21", borderColor: "#2c3039", borderWidth: 1, borderRadius: 15, marginBottom: 25 }, profileIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#351823", alignItems: "center", justifyContent: "center" }, profileTitle: { color: "#f5f6f8", fontWeight: "700", fontSize: 13 }, profileSub: { color: "#8e95a2", fontSize: 10, marginTop: 3 }, activePill: { borderWidth: 1, borderColor: "#355c4b", backgroundColor: "#173028", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }, activeText: { color: "#65d99b", fontSize: 8, fontWeight: "800", letterSpacing: 1 }, section: { color: "#ff3355", fontSize: 9, fontWeight: "800", letterSpacing: 2, marginBottom: 10, marginTop: 3 }, card: { backgroundColor: "#1a1c21", borderColor: "#2c3039", borderWidth: 1, borderRadius: 15, marginBottom: 23, overflow: "hidden" }, rowTitle: { color: "#f1f2f5", fontWeight: "700", fontSize: 13 }, rowSub: { color: "#8c93a0", fontSize: 10, marginTop: 4, lineHeight: 15 }, themeRow: { marginTop: 17, gap: 8 }, themeOption: { flexDirection: "row", alignItems: "center", gap: 9, padding: 9, borderRadius: 10, borderWidth: 1, borderColor: "transparent" }, themeSelected: { borderColor: "#652237", backgroundColor: "#251a20" }, themeSwatch: { width: 27, height: 27, borderRadius: 8 }, midnight: { backgroundColor: "#11141a", borderWidth: 1, borderColor: "#ff3355" }, crimson: { backgroundColor: "#3c1324" }, graphite: { backgroundColor: "#30343d" }, themeText: { color: "#9ca2ad", fontSize: 12, flex: 1 }, themeTextActive: { color: "#f5f6f8", fontWeight: "700" }, settingRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14 }, rowBorder: { borderBottomWidth: 1, borderBottomColor: "#2b2f37" }, settingIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#2a1b21", alignItems: "center", justifyContent: "center" }, linkRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderBottomWidth: 1, borderBottomColor: "#2b2f37" }, linkIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#24262d", alignItems: "center", justifyContent: "center" }, footer: { textAlign: "center", color: "#666d79", fontSize: 10, marginTop: 3, letterSpacing: .4 },
});
