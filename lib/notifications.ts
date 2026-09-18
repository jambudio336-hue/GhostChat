import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let ready = false;

export async function prepareNotifications() {
  if (ready || Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ghostchat-messages", {
      name: "GhostChat Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      sound: "default",
      lightColor: "#ff3355",
    });
    await Notifications.setNotificationChannelAsync("ghostchat-calls", {
      name: "GhostChat Calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: "default",
      lightColor: "#ff3355",
    });
  }
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== "granted") return false;
  }
  ready = true;
  return true;
}

export async function notifyIncomingMessage(sender: string, preview: string) {
  if (!(await prepareNotifications())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `Pesan baru dari ${sender}`, body: preview.slice(0, 120), sound: "default", data: { type: "message" } },
    trigger: null,
  });
}

export async function notifyIncomingCall(sender: string, kind: "audio" | "video") {
  if (!(await prepareNotifications())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: `Panggilan ${kind === "video" ? "video" : "suara"} masuk`, body: `${sender} mengundang kamu untuk terhubung di GhostChat`, sound: "default", data: { type: "call", kind } },
    trigger: null,
  });
}
