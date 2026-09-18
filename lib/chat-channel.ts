import * as FileSystem from "expo-file-system/legacy";
import { notifyIncomingMessage } from "@/lib/notifications";

export type ChatPacket = { id: string; text: string; time: string; mine?: boolean; kind?: "text" | "file" | "voice" | "photo"; uri?: string; name?: string };
type Listener = (packet: ChatPacket) => void;
let sendOverDataChannel: ((packet: unknown) => boolean) | null = null;
const listeners = new Set<Listener>();
const incomingFiles = new Map<string, { name: string; mime: string; chunks: string[]; kind: ChatPacket["kind"] }>();

export function setChatTransport(send: ((packet: unknown) => boolean) | null) { sendOverDataChannel = send; }
export function sendPeerMessage(text: string) { return sendOverDataChannel?.({ type: "chat", text }) ?? false; }
export function subscribePeerMessages(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function publishPeerMessage(text: string) { const packet: ChatPacket = { id: `remote-${Date.now()}`, text, time: "sekarang" }; listeners.forEach((listener) => listener(packet)); void notifyIncomingMessage("Partner GhostChat", text); }

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
  if (packet.type === "chat" && typeof packet.text === "string") return publishPeerMessage(packet.text);
  if (packet.type === "file-start") { incomingFiles.set(packet.id, { name: packet.name, mime: packet.mime, kind: packet.kind ?? "file", chunks: [] }); return; }
  if (packet.type === "file-chunk") { incomingFiles.get(packet.id)?.chunks.push(packet.data); return; }
  if (packet.type === "file-end") {
    const file = incomingFiles.get(packet.id); if (!file) return;
    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}${file.name}`;
    await FileSystem.writeAsStringAsync(uri, file.chunks.join(""), { encoding: FileSystem.EncodingType.Base64 });
    incomingFiles.delete(packet.id);
    const label = file.kind === "voice" ? "Pesan suara diterima" : `File diterima: ${file.name}`;
    listeners.forEach((listener) => listener({ id: `remote-${Date.now()}`, text: label, time: "sekarang", kind: file.kind, uri, name: file.name }));
    void notifyIncomingMessage("Partner GhostChat", label);
  }
}
