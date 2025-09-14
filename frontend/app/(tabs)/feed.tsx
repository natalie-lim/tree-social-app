// app/(tabs)/feed.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const COLORS = {
  bg: "#FFF6EC",     // soft cream
  brand: "#2F4A43",  // deep green (logo / active)
  chip: "#1F5B4E",   // dark teal for buttons
  chipText: "#FFFFFF",
  text: "#222326",
  sub: "#6F7276",
  inputBg: "#F2F4F5",
  border: "#E3E6E8",
};

export default function Feed() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: 60, paddingBottom: 24 }}>
      {/* Top bar */}
      <View style={styles.topRow}>
        <Text style={styles.brand}>leaflet</Text>

        <View style={styles.icons}>
          <Ionicons name="calendar-outline" size={22} color={COLORS.text} />
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} style={{ marginLeft: 14 }} />
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.sub} />
        <TextInput
          placeholder="Search a place, member, etc."
          placeholderTextColor={COLORS.sub}
          style={styles.searchInput}
          onSubmitEditing={(e) => router.push({ pathname: "/(tabs)/search", params: { q: e.nativeEvent.text } })}
          returnKeyType="search"
        />
      </View>

      {/* Pills row */}
      <View style={styles.pillsRow}>
        <Pill icon="calendar-outline" label="Add Place" onPress={() => router.push('/add-place')} />
        <Pill icon="navigate-outline" label="Open Map" onPress={() => router.push("/map")} />
      </View>

      {/* Feed placeholder */}
      <Text style={styles.sectionTitle}>Your Feed</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nothing here yet</Text>
        <Text style={styles.cardSub}>Follow friends or add places to see updates.</Text>
      </View>
    </ScrollView>
  );
}

function Pill({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pill}>
      <Ionicons name={icon} size={16} color={COLORS.chipText} />
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 14, // bump content down a bit
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.brand,
    letterSpacing: 0.5,
  },
  icons: { flexDirection: "row", alignItems: "center" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },

  pillsRow: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 10,
    columnGap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.chip,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillText: {
    color: COLORS.chipText,
    fontWeight: "700",
    marginLeft: 6,
  },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  cardSub: {
    marginTop: 6,
    color: COLORS.sub,
  },
});
