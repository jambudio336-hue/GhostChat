import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { addIceCandidate, createWebRTCSession, type SignalPayload, type WebRTCSession } from "@/lib/webrtc";

type CallKind = "audio" | "video";

export default function CallsScreen() {
  const [kind, setKind] = useState<CallKind>("audio");
  const [session, setSession] = useState<WebRTCSession | null>(null);
  const [outgoing, setOutgoing] = useState("");
  const [incoming, setIncoming] = useState("");
  const [status, setStatus] = useState("Siap untuk koneksi peer-to-peer");
  const [remoteActive, setRemoteActive] = useState(false);

  useEffect(() => () => session?.close(), [session]);

  const signalHandler = (payload: SignalPayload) => {
    if (payload.type !== "ice") setOutgoing(JSON.stringify(payload));
  };

  const startCall = async () => {
    try {
      session?.close();
      setStatus("Meminta izin mikrofon dan kamera...");
      const next = await createWebRTCSession(kind, signalHandler, () => { setRemoteActive(true); setStatus("Media partner aktif · terenkripsi peer-to-peer"); });
      const offer = await next.createOffer();
      setSession(next);
      setOutgoing(JSON.stringify(offer));
      setStatus("Offer siap. Salin ke perangkat partner.");
    } catch (error) {
      Alert.alert("WebRTC belum siap", error instanceof Error ? error.message : "Buat development build Android/iOS untuk mengaktifkan WebRTC.");
      setStatus("Menunggu development build native");
    }
  };

  const acceptOffer = async () => {
    try {
      const payload = JSON.parse(incoming) as SignalPayload;
      if (payload.type !== "offer") throw new Error("Payload harus bertipe offer.");
      const next = await createWebRTCSession(kind, signalHandler, () => { setRemoteActive(true); setStatus("Media partner aktif · terenkripsi peer-to-peer"); });
      const answer = await next.acceptOffer(payload);
      setSession(next);
      setOutgoing(JSON.stringify(answer));
      setStatus("Answer siap. Salin kembali ke perangkat pembuat offer.");
    } catch (error) {
      Alert.alert("Offer tidak valid", error instanceof Error ? error.message : "Periksa JSON signaling.");
    }
  };

  const applyAnswer = async () => {
    try {
      const payload = JSON.parse(incoming) as SignalPayload;
      if (!session) throw new Error("Buat offer terlebih dahulu.");
      if (payload.type === "ice") await addIceCandidate(session, payload);
      else await session.acceptAnswer(payload);
      setStatus("Answer diterapkan. Menunggu media partner...");
    } catch (error) {
      Alert.alert("Answer tidak valid", error instanceof Error ? error.message : "Periksa JSON signaling.");
    }
  };

  const copy = async () => { await Clipboard.setStringAsync(outgoing); Alert.alert("Tersalin", "Kirim signaling JSON ke partner melalui chat pribadi atau QR eksternal."); };
  const closeCall = () => { session?.close(); setSession(null); setRemoteActive(false); setOutgoing(""); setStatus("Panggilan ditutup"); };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={styles.kicker}>GHOSTCHAT / P2P</Text><Text style={styles.title}>Calls</Text></View><View style={[styles.statusDot, remoteActive && styles.statusLive]} /></View>
    <View style={styles.explainer}><MaterialIcons name="security" size={22} color="#ff4968" /><View style={{ flex: 1 }}><Text style={styles.explainerTitle}>Tanpa backend, tetap privat</Text><Text style={styles.explainerText}>Offer/answer ditukar manual. Server hanya STUN publik untuk membantu koneksi NAT; audio/video tidak melewati server GhostChat.</Text></View></View>
    <Text style={styles.section}>JENIS PANGGILAN</Text>
    <View style={styles.segment}><Pressable onPress={() => setKind("audio")} style={[styles.segmentButton, kind === "audio" && styles.segmentActive]}><MaterialIcons name="call" size={17} color={kind === "audio" ? "#fff" : "#8d94a1"} /><Text style={[styles.segmentText, kind === "audio" && styles.segmentTextActive]}>SUARA</Text></Pressable><Pressable onPress={() => setKind("video")} style={[styles.segmentButton, kind === "video" && styles.segmentActive]}><MaterialIcons name="videocam" size={17} color={kind === "video" ? "#fff" : "#8d94a1"} /><Text style={[styles.segmentText, kind === "video" && styles.segmentTextActive]}>VIDEO</Text></Pressable></View>
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={startCall}><MaterialIcons name={kind === "video" ? "videocam" : "call"} size={19} color="#fff" /><Text style={styles.primaryText}>BUAT OFFER {kind === "video" ? "VIDEO" : "SUARA"}</Text></Pressable>
    <Text style={styles.status}>{status}</Text>
    <Text style={styles.section}>SIGNALING MANUAL</Text>
    <View style={styles.card}><Text style={styles.fieldLabel}>PAYLOAD DARI PARTNER</Text><TextInput value={incoming} onChangeText={setIncoming} placeholder="Tempel JSON offer atau answer di sini" placeholderTextColor="#777e8a" multiline style={styles.textArea} /><View style={styles.buttonRow}><Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={acceptOffer}><MaterialIcons name="call-received" size={17} color="#ff4968" /><Text style={styles.secondaryText}>TERIMA OFFER</Text></Pressable><Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={applyAnswer}><MaterialIcons name="link" size={17} color="#ff4968" /><Text style={styles.secondaryText}>TERAPKAN ANSWER</Text></Pressable></View></View>
    {outgoing ? <View style={styles.card}><View style={styles.outputHeader}><Text style={styles.fieldLabel}>PAYLOAD UNTUK PARTNER</Text><Pressable style={styles.copyButton} onPress={copy}><MaterialIcons name="content-copy" size={15} color="#ff4968" /><Text style={styles.copyText}>SALIN</Text></Pressable></View><Text selectable style={styles.output}>{outgoing}</Text></View> : null}
    {session ? <Pressable style={styles.endButton} onPress={closeCall}><MaterialIcons name="call-end" size={18} color="#fff" /><Text style={styles.primaryText}>AKHIRI KONEKSI</Text></Pressable> : null}
    <Text style={styles.tip}>Tip: kedua perangkat harus memakai signaling satu per satu. Setelah answer diterapkan, WebRTC mencoba jalur langsung antar-perangkat.</Text>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ container: { padding: 18, paddingBottom: 35 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, kicker: { color: "#ff3355", fontSize: 9, letterSpacing: 2.5, fontWeight: "800" }, title: { color: "#f5f6f8", fontSize: 30, fontWeight: "800", marginTop: 5 }, statusDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: "#555c68", borderWidth: 3, borderColor: "#292d35" }, statusLive: { backgroundColor: "#46db8b", borderColor: "#205c44" }, explainer: { flexDirection: "row", gap: 11, padding: 14, backgroundColor: "#251a20", borderWidth: 1, borderColor: "#5b2a3b", borderRadius: 15, marginBottom: 22 }, explainerTitle: { color: "#f5f6f8", fontWeight: "800", fontSize: 13 }, explainerText: { color: "#a6abb6", fontSize: 11, lineHeight: 17, marginTop: 4 }, section: { color: "#ff3355", fontSize: 9, fontWeight: "800", letterSpacing: 2, marginBottom: 9, marginTop: 4 }, segment: { flexDirection: "row", gap: 8, marginBottom: 12 }, segmentButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: "#1a1c21", borderWidth: 1, borderColor: "#2e333d" }, segmentActive: { backgroundColor: "#ff3355", borderColor: "#ff3355" }, segmentText: { color: "#8d94a1", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, segmentTextActive: { color: "#fff" }, primaryButton: { backgroundColor: "#ff3355", borderRadius: 12, minHeight: 48, paddingHorizontal: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, primaryText: { color: "#fff", fontWeight: "800", fontSize: 10, letterSpacing: 1 }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] }, status: { color: "#8f96a4", fontSize: 11, textAlign: "center", marginVertical: 14 }, card: { backgroundColor: "#1a1c21", borderColor: "#2c3039", borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 16 }, fieldLabel: { color: "#8f96a4", fontSize: 9, fontWeight: "800", letterSpacing: 1.5 }, textArea: { minHeight: 90, color: "#f5f6f8", fontSize: 12, lineHeight: 18, textAlignVertical: "top", backgroundColor: "#111318", borderRadius: 10, borderWidth: 1, borderColor: "#303540", padding: 11, marginTop: 9 }, buttonRow: { flexDirection: "row", gap: 8, marginTop: 10 }, secondaryButton: { flex: 1, minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: "#653044", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, paddingHorizontal: 5 }, secondaryText: { color: "#ff4968", fontWeight: "800", fontSize: 9, letterSpacing: .5 }, outputHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, copyButton: { flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 8, paddingVertical: 5 }, copyText: { color: "#ff4968", fontSize: 9, fontWeight: "800" }, output: { color: "#c9cdd4", fontSize: 10, lineHeight: 15, marginTop: 10, backgroundColor: "#111318", borderRadius: 9, padding: 10 }, endButton: { backgroundColor: "#9d2440", borderRadius: 12, minHeight: 48, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 1 }, tip: { color: "#666e7c", fontSize: 10, lineHeight: 16, textAlign: "center", marginTop: 18 }, });
