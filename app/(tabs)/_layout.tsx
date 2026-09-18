import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.tint, tabBarInactiveTintColor: "#737a87", tabBarButton: HapticTab, tabBarStyle: { paddingTop: 8, paddingBottom: bottomPadding, height: 56 + bottomPadding, backgroundColor: "#111318", borderTopColor: "#2b2f38", borderTopWidth: 1 } }}>
    <Tabs.Screen name="index" options={{ title: "Chat", tabBarIcon: ({ color }) => <IconSymbol size={24} name="message.fill" color={color} /> }} />
    <Tabs.Screen name="calls" options={{ title: "Calls", tabBarIcon: ({ color }) => <IconSymbol size={24} name="phone.fill" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <IconSymbol size={24} name="gear" color={color} /> }} />
  </Tabs>;
}
