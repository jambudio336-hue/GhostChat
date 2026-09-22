import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "GhostChat",
  slug: "ghostchat",
  version: "1.0.2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "ghostchat",
  userInterfaceStyle: "dark",
  // react-native-webrtc 124 is more stable on the classic bridge for this Expo SDK.
  newArchEnabled: false,
  ios: { supportsTablet: true, bundleIdentifier: "com.mrk1pl4y.ghostchat", infoPlist: { ITSAppUsesNonExemptEncryption: false, NSCameraUsageDescription: "GhostChat membutuhkan kamera untuk video call privat.", NSMicrophoneUsageDescription: "GhostChat membutuhkan mikrofon untuk panggilan terenkripsi." } },
  android: { adaptiveIcon: { backgroundColor: "#0c0d10", foregroundImage: "./assets/images/android-icon-foreground.png", backgroundImage: "./assets/images/android-icon-background.png", monochromeImage: "./assets/images/android-icon-monochrome.png" }, edgeToEdgeEnabled: true, predictiveBackGestureEnabled: false, package: "com.mrk1pl4y.ghostchat", permissions: ["POST_NOTIFICATIONS", "CAMERA", "RECORD_AUDIO", "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_MICROPHONE", "FOREGROUND_SERVICE_CAMERA"] },
  web: { bundler: "metro", output: "static", favicon: "./assets/images/favicon.png" },
  plugins: ["expo-router", "expo-notifications", "expo-font", "expo-web-browser", ["expo-camera", { cameraPermission: "Allow GhostChat to access your camera.", microphonePermission: "Allow GhostChat to access your microphone.", recordAudioAndroid: true }], ["expo-audio", { microphonePermission: "Allow GhostChat to access your microphone." }], ["expo-video", { supportsBackgroundPlayback: true, supportsPictureInPicture: true }], ["expo-splash-screen", { image: "./assets/images/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#0c0d10" }], ["expo-build-properties", { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } }]],
  experiments: { typedRoutes: true, reactCompiler: true },
};
export default config;
