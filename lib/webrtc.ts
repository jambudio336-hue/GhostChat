import { Platform } from "react-native";

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
  close: () => void;
};

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun.cloudflare.com:3478" }];

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
  return {
    pc,
    localStream,
    remoteStream,
    createOffer: async () => { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); await waitForIce(); return encode(pc.localDescription); },
    acceptOffer: async (payload) => { await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp }); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); await waitForIce(); return encode(pc.localDescription); },
    acceptAnswer: async (payload) => { await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp }); },
    close: () => { localStream.getTracks().forEach((track: any) => track.stop()); pc.close(); },
  };
}

export async function addIceCandidate(session: WebRTCSession, payload: SignalPayload) {
  if (payload.type === "ice" && payload.candidate) await session.pc.addIceCandidate(payload.candidate);
}
