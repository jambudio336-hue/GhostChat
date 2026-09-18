import * as FileSystem from "expo-file-system/legacy";
import { notifyIncomingMessage } from "@/lib/notifications";

export type ChatPacket = { id: string; text: string; time: string; mine?: boolean; kind?: "text" | "file" | "voice" | "photo"; uri?: string; name?: string; status?: "sent" | "read" };
type Listener = (packet: ChatPacket) => void;
let sendOverDataChannel: ((packet: unknown) => boolean) | null = null;
const listeners = new Set<Listener>();
const typingListeners = new Set<(typing: boolean) => void>();
const readListeners = new Set<(id: string) => void>();
const incomingFiles = new Map<string, { name: string; mime: string; chunks: string[]; kind: ChatPacket["kind"] }>();

export function setChatTransport(send: ((packet: unknown) => boolean) | null) { sendOverDataChannel = send; }
export function sendPeerMessage(text: string, id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`) { return sendOverDataChannel?.({ type: "chat", id, text }) ?? false; }
export function sendTyping(typing: boolean) { sendOverDataChannel?.({ type: "typing", typing }); }
export function subscribePeerMessages(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function subscribePeerTyping(listener: (typing: boolean) => void) { typingListeners.add(listener); return () => typingListeners.delete(listener); }
export function subscribePeerRead(listener: (id: string) => void) { readListeners.add(listener); return () => readListeners.delete(listener); }
export function publishPeerMessage(text: string, id?: string) { const packet: ChatPacket = { id: id ?? `remote-${Date.now()}`, text, time: "sekarang", status: "sent" }; listeners.forEach((listener) => listener(packet)); void notifyIncomingMessage("Partner GhostChat", text); }

export async function sendPeerFile(asset: { uri: string; name?: string; mimeType?: string; kind?: ChatPacket["kind"] }) {
  if (!sendOverDataChannel) return false;
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const chunkSize = 48_000;
  if (!sendOverDataChannel({ type: "file-start", id, name: asset.name ?? "attachment", mime: asset.mimeType ?? "application/octet-stream", kind: asset.kind ?? "file" })) return false;
  for (let index = 0; index < base64.length; index += chunkSize) {
    if (!sendOverDataChannel({ type: "file-chunk", id, data: base64.slice(index, index + chunkSize) })) return false;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return sendOverDataChannel({ type: "file-end", id });
}

export async function receivePeerPacket(packet: any) {
  if (packet.type === "typing") { typingListeners.forEach((listener) => listener(Boolean(packet.typing))); return; }
  if (packet.type === "read" && typeof packet.id === "string") { readListeners.forEach((listener) => listener(packet.id)); return; }
  if (packet.type === "chat" && typeof packet.text === "string") { if (packet.id) sendOverDataChannel?.({ type: "read", id: packet.id }); return publishPeerMessage(packet.text, packet.id); }
  if (packet.type === "file-start") { incomingFiles.set(packet.id, { name: packet.name, mime: packet.mime, kind: packet.kind ?? "file", chunks: [] }); return; }
  if (packet.type === "file-chunk") { incomingFiles.get(packet.id)?.chunks.push(packet.data); return; }
  if (packet.type === "file-end") {
    const file = incomingFiles.get(packet.id); if (!file) return;
    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}${file.name}`;
    await FileSystem.writeAsStringAsync(uri, file.chunks.join(""), { encoding: FileSystem.EncodingType.Base64 });
    incomingFiles.delete(packet.id);
    const label = file.kind === "voice" ? "Pesan suara diterima" : `File diterima: ${file.name}`;
    listeners.forEach((listener) => listener({ id: `remote-${Date.now()}`, text: label, time: "sekarang", kind: file.kind, uri, name: file.name, status: "sent" }));
    void notifyIncomingMessage("Partner GhostChat", label);
  }
}
