import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, ImageBackground, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import introVideo from "../../assets/video/ghostchat-intro.mp4";
import chatBackground from "../../assets/images/chat-background.jpg";
import { sendPeerMessage, subscribePeerMessages, type ChatPacket } from "@/lib/chat-channel";

const WA_NUMBER = "6285262965282";
const INTRO_KEY = "ghostchat_intro_seen";

type Message = { id: string; text: string; mine?: boolean; time: string };

const initialMessages: Message[] = [
  { id: "1", text: "Koneksi aman. Pesan akan hilang dalam 5 menit.", time: "22:48" },
  { id: "2", text: "Halo, sudah terhubung.", mine: true, time: "22:49" },
];

export default function HomeScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [showPairing, setShowPairing] = useState(false);
  const [pairingMode, setPairingMode] = useState<"generate" | "receive">("generate");
  const [pairingCode, setPairingCode] = useState("GHOST-7K4P-92XQ");
  const [pairingDays, setPairingDays] = useState<1 | 2 | 3>(1);
  const [pairingExpiresAt, setPairingExpiresAt] = useState(() => Date.now() + 86400000);
  const introPlayer = useVideoPlayer(introVideo, (player) => {
    player.loop = true;
    player.muted = false;
    player.volume = 1;
    player.play();
  });

  useEffect(() => {
    AsyncStorage.getItem(INTRO_KEY).then((seen) => {
      if (!seen) setShowIntro(true);
    });
  }, []);
  useEffect(() => { const unsubscribe = subscribePeerMessages((packet: ChatPacket) => setMessages((current) => [...current, packet])); return () => { unsubscribe(); }; }, []);

  const openWhatsApp = async (kind: "rating" | "bug") => {
    const message = kind === "rating" ? "Halo GhostChat, saya ingin memberikan rating dan masukan: " : "Halo GhostChat, saya ingin melaporkan bug: ";
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else Alert.alert("WhatsApp tidak tersedia", "Silakan buka WhatsApp secara manual.");
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    if (!sendPeerMessage(text)) {
      Alert.alert("Belum terhubung", "Hubungkan panggilan WebRTC terlebih dahulu agar pesan terkirim ke perangkat partner.");
      return;
    }
    setMessages((current) => [...current, { id: Date.now().toString(), text, mine: true, time: "sekarang" }]);
    setDraft("");
  };
  const copyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Pesan disalin", "Teks pesan sudah masuk ke clipboard.");
  };

  const generatePairing = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const part = () => Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    setPairingCode(`GHOST-${part()}-${part()}`);
    setPairingExpiresAt(Date.now() + pairingDays * 86400000);
  };

  const closeIntro = async () => {
    await AsyncStorage.setItem(INTRO_KEY, "1");
    setShowIntro(false);
  };

  const subtitle = useMemo(() => "Perangkat terhubung · Enkripsi aktif", []);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}><View style={styles.logo}><Text style={styles.logoText}>G</Text></View><Text style={styles.brand}>GHOST<span>CHAT</span></Text></View>
            <Text style={styles.eyebrow}>PRIVATE MESSENGER</Text>
          </View>
          <View style={styles.onlinePill}><View style={styles.dot} /><Text style={styles.onlineText}>ONLINE</Text></View>
        </View>

        <View style={styles.connectionCard}>
          <View style={styles.connectionIcon}><MaterialIcons name="verified-user" size={22} color="#ff3355" /></View>
          <View style={{ flex: 1 }}><Text style={styles.connectionTitle}>Saluran aman aktif</Text><Text style={styles.connectionSub}>{subtitle}</Text></View>
          <Pressable style={styles.pairButton} onPress={() => setShowPairing(true)}><MaterialIcons name="link" size={16} color="#f5f7fa" /><Text style={styles.pairText}>PAIR</Text></Pressable>
        </View>

        <View style={styles.chatHeader}><View><Text style={styles.sectionLabel}>CONVERSATION</Text><Text style={styles.chatTitle}>Night Owl <Text style={styles.lock}>⌁</Text></Text></View><View style={styles.deviceTag}><MaterialIcons name="smartphone" size={14} color="#9298a6" /><Text style={styles.deviceText}>ANDROID · 5G</Text></View></View>

        <ImageBackground source={chatBackground} style={styles.chatBackground} imageStyle={styles.chatBackgroundImage}>
          <View style={styles.chatTint} />
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            renderItem={({ item }) => (
              <View style={[styles.messageRow, item.mine && styles.messageRowMine]}>
                {!item.mine && <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>}
                <Pressable onLongPress={() => copyMessage(item.text)} delayLongPress={420} style={[styles.bubble, item.mine ? styles.mineBubble : styles.theirBubble]}><Text style={styles.messageText}>{item.text}</Text><Text style={styles.messageTime}>{item.time} {item.mine ? "✓✓" : ""}</Text></Pressable>
              </View>
            )}
          />
        </ImageBackground>

        <View style={styles.composer}>
          <Pressable style={styles.attach}><MaterialIcons name="add" size={23} color="#ff3355" /></Pressable>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Tulis pesan terenkripsi..." placeholderTextColor="#777d8a" style={styles.input} onSubmitEditing={sendMessage} returnKeyType="send" />
          <Pressable style={styles.voice}><MaterialIcons name="mic" size={20} color="#c3c7d0" /></Pressable>
          <Pressable style={styles.send} onPress={sendMessage}><MaterialIcons name="arrow-upward" size={21} color="#fff" /></Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.action} onPress={() => router.push("/calls")}><MaterialIcons name="call" size={19} color="#e7e9ed" /><Text style={styles.actionText}>SUARA</Text></Pressable>
          <Pressable style={styles.action} onPress={() => router.push("/calls")}><MaterialIcons name="videocam" size={19} color="#e7e9ed" /><Text style={styles.actionText}>VIDEO</Text></Pressable>
          <Pressable style={styles.action} onPress={() => openWhatsApp("bug")}><MaterialIcons name="bug-report" size={19} color="#e7e9ed" /><Text style={styles.actionText}>LAPOR</Text></Pressable>
          <Pressable style={styles.action} onPress={() => openWhatsApp("rating")}><MaterialIcons name="star" size={19} color="#ffb83e" /><Text style={styles.actionText}>RATING</Text></Pressable>
        </View>
      </View>

      <Modal visible={showIntro} animationType="fade">
        <View style={styles.intro}><VideoView style={styles.introVideo} player={introPlayer} contentFit="cover" nativeControls={false} /><View style={styles.videoShade} /><View style={styles.introContent}><Text style={styles.introGhost}>GHOST</Text><Text style={styles.introChat}>CHAT</Text><Text style={styles.introLine}>PRIVATE MESSENGER</Text><View style={styles.introDivider} /><Text style={styles.disclaimerTitle}>DISCLAIMER ANONIMITAS</Text><Text style={styles.disclaimer}>GhostChat tidak menyimpan akun atau riwayat pesan. Gunakan aplikasi secara bertanggung jawab. Semua pesan dihapus otomatis setelah 5 menit.</Text><Text style={styles.byline}>By. MR.K1pl4y</Text><Pressable style={styles.soundButton} onPress={() => introPlayer.muted = !introPlayer.muted}><MaterialIcons name={introPlayer.muted ? "volume-off" : "volume-up"} size={16} color="#fff" /><Text style={styles.soundText}>{introPlayer.muted ? "NYALAKAN SUARA" : "SUARA AKTIF"}</Text></Pressable><Pressable style={styles.enterButton} onPress={closeIntro}><Text style={styles.enterText}>SAYA MENGERTI  →</Text></Pressable></View></View>
      </Modal>

      <Modal visible={showPairing} transparent animationType="slide" onRequestClose={() => setShowPairing(false)}>
        <View style={styles.modalBackdrop}><View style={styles.pairModal}><View style={styles.modalHandle} /><View style={styles.modalTitleRow}><Text style={styles.modalTitle}>Hubungkan perangkat</Text><Pressable onPress={() => setShowPairing(false)}><MaterialIcons name="close" size={23} color="#aeb4c0" /></Pressable></View><Text style={styles.modalSub}>Pairing berlaku minimal 1 hari dan maksimal 3 hari. Setelah kedaluwarsa, buat kode baru.</Text><View style={styles.segment}><Pressable onPress={() => setPairingMode("generate")} style={[styles.segmentButton, pairingMode === "generate" && styles.segmentActive]}><Text style={[styles.segmentText, pairingMode === "generate" && styles.segmentTextActive]}>BUAT KODE</Text></Pressable><Pressable onPress={() => setPairingMode("receive")} style={[styles.segmentButton, pairingMode === "receive" && styles.segmentActive]}><Text style={[styles.segmentText, pairingMode === "receive" && styles.segmentTextActive]}>MASUKKAN KODE</Text></Pressable></View>{pairingMode === "generate" ? <><Text style={styles.codeLabel}>BERLAKU SELAMA</Text><View style={styles.expiryRow}>{([1, 2, 3] as const).map((days) => <Pressable key={days} onPress={() => setPairingDays(days)} style={[styles.expiryOption, pairingDays === days && styles.expirySelected]}><Text style={[styles.expiryText, pairingDays === days && styles.expiryTextActive]}>{days} HARI</Text></Pressable>)}</View><Text style={styles.codeLabel}>PAIRING CODE</Text><Text style={styles.pairingCode}>{pairingCode}</Text><Text style={styles.expiryHint}>Kode aktif sampai {new Date(pairingExpiresAt).toLocaleDateString("id-ID")}</Text><Pressable style={styles.primaryButton} onPress={generatePairing}><MaterialIcons name="refresh" size={18} color="#fff" /><Text style={styles.primaryText}>GENERATE CODE BARU</Text></Pressable><Pressable style={styles.secondaryButton} onPress={() => Alert.alert("QR Code", "QR pairing dapat dibuat dari pairing code ini. Kode tetap memiliki batas waktu yang sama.")}><MaterialIcons name="qr-code-2" size={18} color="#ff3355" /><Text style={styles.secondaryText}>TAMPILKAN QR CODE</Text></Pressable></> : <><TextInput placeholder="Contoh: GHOST-ABCD-1234" placeholderTextColor="#777d8a" autoCapitalize="characters" style={styles.codeInput} /><Pressable style={styles.primaryButton} onPress={() => Alert.alert("Menunggu konfirmasi", "Permintaan pairing dikirim. Pastikan partner mengonfirmasi sebelum kode kedaluwarsa.")}><MaterialIcons name="check-circle" size={18} color="#fff" /><Text style={styles.primaryText}>KONFIRMASI PAIRING</Text></Pressable></>}</View></View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 14 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }, brandRow: { flexDirection: "row", alignItems: "center", gap: 9 }, logo: { width: 31, height: 31, borderRadius: 9, backgroundColor: "#ff3355", alignItems: "center", justifyContent: "center", shadowColor: "#ff3355", shadowOpacity: 0.5, shadowRadius: 12 }, logoText: { color: "#140b0e", fontSize: 19, fontWeight: "900" }, brand: { color: "#f6f7fa", fontSize: 20, letterSpacing: 2, fontWeight: "800" }, eyebrow: { color: "#858b99", fontSize: 9, letterSpacing: 2.5, marginTop: 5, marginLeft: 41 }, onlinePill: { flexDirection: "row", alignItems: "center", gap: 6, borderColor: "#30343e", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 }, dot: { width: 6, height: 6, backgroundColor: "#46db8b", borderRadius: 5 }, onlineText: { color: "#aeb4c0", fontSize: 9, letterSpacing: 1.3, fontWeight: "700" }, connectionCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 13, borderWidth: 1, borderColor: "#2c3039", backgroundColor: "#1a1c21", borderRadius: 15, marginBottom: 24 }, connectionIcon: { width: 39, height: 39, backgroundColor: "#351823", borderRadius: 12, alignItems: "center", justifyContent: "center" }, connectionTitle: { color: "#f2f3f5", fontSize: 13, fontWeight: "700" }, connectionSub: { color: "#8d94a1", fontSize: 10, marginTop: 3 }, pairButton: { backgroundColor: "#ff3355", borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", gap: 5, alignItems: "center" }, pairText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 13 }, chatBackground: { flex: 1, borderRadius: 16, overflow: "hidden", backgroundColor: "#101217" }, chatBackgroundImage: { opacity: 0.48, resizeMode: "cover" }, chatTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7, 8, 11, 0.48)" }, sectionLabel: { color: "#ff3355", fontSize: 9, letterSpacing: 2, fontWeight: "800" }, chatTitle: { color: "#f5f6f8", fontSize: 24, fontWeight: "800", marginTop: 4 }, lock: { color: "#888e9a", fontSize: 20 }, deviceTag: { flexDirection: "row", gap: 5, alignItems: "center", marginBottom: 4 }, deviceText: { color: "#737a87", fontSize: 9, letterSpacing: 1 }, messages: { gap: 12, paddingVertical: 8, flexGrow: 1 }, messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, messageRowMine: { justifyContent: "flex-end" }, avatar: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#72253b", alignItems: "center", justifyContent: "center" }, avatarText: { color: "#ffb6c3", fontWeight: "800", fontSize: 11 }, bubble: { maxWidth: "78%", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14 }, theirBubble: { backgroundColor: "#202329", borderBottomLeftRadius: 4 }, mineBubble: { backgroundColor: "#8f1e3b", borderBottomRightRadius: 4 }, messageText: { color: "#f0f1f4", fontSize: 13, lineHeight: 19 }, messageTime: { color: "#aab0ba", fontSize: 9, marginTop: 5, textAlign: "right" }, composer: { borderColor: "#30343d", borderWidth: 1, borderRadius: 16, minHeight: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 7, backgroundColor: "#1b1d22", marginTop: 10 }, attach: { width: 34, alignItems: "center" }, input: { flex: 1, color: "#f4f5f7", fontSize: 13, paddingVertical: 12 }, voice: { padding: 8 }, send: { width: 35, height: 35, borderRadius: 11, backgroundColor: "#ff3355", alignItems: "center", justifyContent: "center" }, actionRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 17, borderBottomColor: "#2b2f38", borderBottomWidth: 1 }, action: { alignItems: "center", gap: 5 }, actionText: { color: "#858b98", fontSize: 8, letterSpacing: 1, fontWeight: "800" }, intro: { flex: 1, backgroundColor: "#0c0d10", alignItems: "center", justifyContent: "center", padding: 30, overflow: "hidden" }, introVideo: { ...StyleSheet.absoluteFillObject }, videoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5, 6, 9, 0.68)" }, introContent: { alignItems: "center", justifyContent: "center", width: "100%" }, soundButton: { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#754052", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, marginTop: 15 }, soundText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 1 }, introGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.06, borderWidth: 1, borderColor: "#ff3355" }, introGhost: { color: "#ff3355", fontSize: 42, letterSpacing: 12, fontWeight: "900" }, introChat: { color: "#f7f7f8", fontSize: 42, letterSpacing: 12, fontWeight: "300", marginTop: -4 }, introLine: { color: "#9da2ac", letterSpacing: 4, fontSize: 10, marginTop: 17 }, introDivider: { height: 1, width: 54, backgroundColor: "#ff3355", marginVertical: 42 }, disclaimerTitle: { color: "#f5f6f8", fontWeight: "800", letterSpacing: 2, fontSize: 14, textAlign: "center" }, disclaimer: { color: "#999faa", fontSize: 13, textAlign: "center", lineHeight: 21, marginTop: 14 }, byline: { color: "#ff3355", fontSize: 11, letterSpacing: 1.5, marginTop: 20 }, enterButton: { backgroundColor: "#ff3355", borderRadius: 13, paddingVertical: 15, paddingHorizontal: 25, marginTop: 36 }, enterText: { color: "#fff", fontWeight: "800", letterSpacing: 1 }, modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.72)", justifyContent: "flex-end" }, pairModal: { backgroundColor: "#17191e", borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 22, paddingBottom: 35 }, modalHandle: { height: 4, width: 42, backgroundColor: "#4b505d", borderRadius: 3, alignSelf: "center", marginBottom: 19 }, modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, modalTitle: { color: "#f5f6f8", fontSize: 22, fontWeight: "800" }, modalSub: { color: "#9298a6", fontSize: 12, lineHeight: 18, marginTop: 8 }, segment: { flexDirection: "row", backgroundColor: "#22252c", borderRadius: 12, padding: 4, marginTop: 20 }, segmentButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 9 }, segmentActive: { backgroundColor: "#ff3355" }, segmentText: { color: "#9399a5", fontSize: 10, fontWeight: "800" }, segmentTextActive: { color: "#fff" }, codeLabel: { color: "#8f96a4", letterSpacing: 2, fontSize: 9, marginTop: 28, textAlign: "center" }, expiryRow: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "center" }, expiryOption: { borderWidth: 1, borderColor: "#3b404b", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9 }, expirySelected: { borderColor: "#ff3355", backgroundColor: "#3b1723" }, expiryText: { color: "#8f96a4", fontSize: 10, fontWeight: "800" }, expiryTextActive: { color: "#ff6a82" }, expiryHint: { color: "#737b89", textAlign: "center", fontSize: 10, marginBottom: 7 }, pairingCode: { color: "#ff4968", fontSize: 25, letterSpacing: 3, fontWeight: "900", textAlign: "center", marginTop: 10, marginBottom: 23 }, primaryButton: { backgroundColor: "#ff3355", borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 13 }, primaryText: { color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 1 }, secondaryButton: { borderColor: "#51303b", borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 10 }, secondaryText: { color: "#ff4968", fontWeight: "800", fontSize: 11, letterSpacing: 1 }, codeInput: { borderWidth: 1, borderColor: "#3b404b", color: "#fff", backgroundColor: "#202329", borderRadius: 12, padding: 15, marginTop: 25, fontSize: 15, letterSpacing: 1 },
});
