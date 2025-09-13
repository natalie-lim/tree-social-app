import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Home() {
  return (
    <View style={styles.container}>
      <Ionicons name="leaf" size={96} style={styles.leaf} />

      <Text style={styles.title}>LEAFLET</Text>

      <PillButton label="sign up" onPress={() => router.push("/signup")} />
      <PillButton label="login"   onPress={() => router.push("/login")} />
    </View>
  );
}

function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF6EC", // cream
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  leaf: {
    color: "#749C75",
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#3E3A44",
    letterSpacing: 2,
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#749C75",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginVertical: 8,
    minWidth: 180,
    alignItems: "center",
  },
  buttonText: {
    color: "#2F2B34",
    fontWeight: "800",
    fontSize: 20,
    textTransform: "lowercase",
  },
});
