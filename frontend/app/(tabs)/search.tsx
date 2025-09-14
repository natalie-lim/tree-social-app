import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const COLORS = {
  text: "#111827",
  border: "#D1D5DB",
  bg: "#FFFFFF",
};

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    // TODO: trigger your search with `query`
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <ThemedView style={styles.container}>
          <Text style={styles.header}>Search</Text>

          {/* Search bar at the top */}
          <ThemedView style={styles.searchBarContainer}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="Search users, lists, content..."
              placeholderTextColor="#888"
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing" // iOS only
              autoCorrect={false}
              autoCapitalize="none"
            />
          </ThemedView>

          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>Search</ThemedText>
            {/* Add any badges/icons here; spacing handled by marginRight on children */}
          </View>

          <ThemedText>Search for users, lists, and content.</ThemedText>
        </ThemedView>
      </View>
    </SafeAreaView>
  );
}

const BG = "#FFFAF0"; // Floral White

const styles = StyleSheet.create({
  // stretch bg to the very top (like Profile)
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    // Use padding, not marginTop, so bg remains continuous
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 20 : 20,
    paddingBottom: 60,
  },

  searchBarContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: COLORS.bg, // keep input white so it pops
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: "lowercase",
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    marginRight: 8, // safe 'gap'
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
});
