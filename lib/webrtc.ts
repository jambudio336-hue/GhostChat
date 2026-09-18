import { Platform } from "react-native";
import { publishPeerMessage, setChatTransport } from "@/lib/chat-channel";

export type SignalPayload = {
  type: "offer" | "answer" | "ice";
  sdp?: string;
  candidate?: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };
};

export type WebRTCSession = {
  pc: any;
  localStream: any;
  remoteStream: any;
  createOffer: () => Promise<SignalPayload>;
  acceptOffer: (payload: SignalPayload) => Promise<SignalPayload>;
  acceptAnswer: (payload: SignalPayload) => Promise<void>;
  getQuality: () => Promise<NetworkQuality>;
  close: () => void;
};

export type NetworkQuality = {
  label: "MENUNGGU" | "BAIK" | "CUKUP" | "LEMAH";
  color: string;
  rttMs: number | null;
  packetLoss: number | null;
  route: "LANGSUNG" | "TURN RELAY" | "MENUNGGU";
};

// Open Relay static-auth is a free demo relay. Replace these with credentials
// from a dedicated TURN provider for production deployments.
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: [
      "turn:staticauth.openrelay.metered.ca:80",
      "turn:staticauth.openrelay.metered.ca:443?transport=tcp",
      "turns:staticauth.openrelay.metered.ca:443",
    ],
    username: "openrelayproject",
    credential: "openrelayprojectsecret",
  },
];

function getRuntime() {
  if (Platform.OS === "web") {
    const browser = globalThis as any;
    return { RTCPeerConnection: browser.RTCPeerConnection, mediaDevices: browser.navigator?.mediaDevices };
  }
  // Native WebRTC is loaded only in a development build / standalone APK.
  // Expo Go intentionally does not include this native module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("react-native-webrtc");
}

export async function createWebRTCSession(kind: "audio" | "video", onSignal: (payload: SignalPayload) => void, onRemoteStream: (stream: any) => void): Promise<WebRTCSession> {
  const runtime = getRuntime();
  if (!runtime.RTCPeerConnection || !runtime.mediaDevices?.getUserMedia) {
    throw new Error("WebRTC belum tersedia. Jalankan GhostChat sebagai development build Android/iOS atau browser yang mendukung WebRTC.");
  }
  const pc = new runtime.RTCPeerConnection({ iceServers });
  let dataChannel: any = null;
  const attachDataChannel = (channel: any) => {
    dataChannel = channel;
    channel.onmessage = (event: any) => {
      try { const packet = JSON.parse(String(event.data)); if (packet.type === "chat" && typeof packet.text === "string") publishPeerMessage(packet.text); } catch { /* ignore malformed data */ }
    };
    setChatTransport((text) => {
      if (dataChannel?.readyState !== "open") return false;
      dataChannel.send(JSON.stringify({ type: "chat", text }));
      return true;
    });
  };
  pc.ondatachannel = (event: any) => attachDataChannel(event.channel);
  const localStream = await runtime.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
  localStream.getTracks().forEach((track: any) => pc.addTrack(track, localStream));
  const remoteStream = typeof MediaStream !== "undefined" ? new MediaStream() : null;
  pc.ontrack = (event: any) => {
    if (remoteStream && event.streams?.[0]) event.streams[0].getTracks().forEach((track: any) => remoteStream.addTrack(track));
    onRemoteStream(event.streams?.[0] ?? remoteStream);
  };
  pc.onicecandidate = (event: any) => {
    if (event.candidate) onSignal({ type: "ice", candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate });
  };
  const waitForIce = () => new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener?.("icegatheringstatechange", done); resolve(); } };
    pc.addEventListener?.("icegatheringstatechange", done);
    setTimeout(resolve, 3500);
  });
  const encode = (description: any): SignalPayload => ({ type: description.type, sdp: description.sdp });
  const getQuality = async (): Promise<NetworkQuality> => {
    const report = await pc.getStats();
    const entries: any[] = [];
    if (report?.forEach) report.forEach((value: any) => entries.push(value));
    else if (Array.isArray(report)) entries.push(...report);
    const pair = entries.find((item) => item.type === "candidate-pair" && (item.state === "succeeded" || item.nominated)) ?? entries.find((item) => item.type === "candidate-pair");
    const inbound = entries.filter((item) => item.type === "inbound-rtp").reduce((sum, item) => sum + (item.packetsReceived ?? 0), 0);
    const lost = entries.filter((item) => item.type === "inbound-rtp").reduce((sum, item) => sum + (item.packetsLost ?? 0), 0);
    const packetLoss = inbound + lost > 0 ? (lost / (inbound + lost)) * 100 : null;
    const rttMs = typeof pair?.currentRoundTripTime === "number" ? Math.round(pair.currentRoundTripTime * 1000) : null;
    const route = pair?.localCandidateId && entries.find((item) => item.id === pair.localCandidateId)?.candidateType === "relay" ? "TURN RELAY" : pair ? "LANGSUNG" : "MENUNGGU";
    const score = rttMs === null && packetLoss === null ? "MENUNGGU" : (rttMs !== null && rttMs > 350) || (packetLoss !== null && packetLoss > 8) ? "LEMAH" : (rttMs !== null && rttMs > 180) || (packetLoss !== null && packetLoss > 3) ? "CUKUP" : "BAIK";
    return { label: score, color: score === "BAIK" ? "#46db8b" : score === "CUKUP" ? "#ffb83e" : score === "LEMAH" ? "#ff4968" : "#8f96a4", rttMs, packetLoss, route };
  };
  return {
    pc,
    localStream,
    remoteStream,
    createOffer: async () => { if (!dataChannel && typeof pc.createDataChannel === "function") attachDataChannel(pc.createDataChannel("ghostchat-chat", { ordered: true })); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await waitForIce(); return encode(pc.localDescription); },
    acceptOffer: async (payload) => { await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp }); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await waitForIce(); return encode(pc.localDescription); },
    acceptAnswer: async (payload) => { await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp }); },
    getQuality,
    close: () => { setChatTransport(null); localStream.getTracks().forEach((track: any) => track.stop()); dataChannel?.close?.(); pc.close(); },
  };
}

export async function addIceCandidate(session: WebRTCSession, payload: SignalPayload) {
  if (payload.type === "ice" && payload.candidate) await session.pc.addIceCandidate(payload.candidate);
}
