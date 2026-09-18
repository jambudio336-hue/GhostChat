import { notifyIncomingMessage } from "@/lib/notifications";

export type ChatPacket = { id: string; text: string; time: string; mine?: boolean };
type Listener = (packet: ChatPacket) => void;

let sendOverDataChannel: ((text: string) => boolean) | null = null;
const listeners = new Set<Listener>();

export function setChatTransport(send: ((text: string) => boolean) | null) {
  sendOverDataChannel = send;
}

export function sendPeerMessage(text: string) {
  return sendOverDataChannel?.(text) ?? false;
}

export function subscribePeerMessages(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishPeerMessage(text: string) {
  const packet: ChatPacket = { id: `remote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, time: "sekarang" };
  listeners.forEach((listener) => listener(packet));
  void notifyIncomingMessage("Partner GhostChat", text);
}
