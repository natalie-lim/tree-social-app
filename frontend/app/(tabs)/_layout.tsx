import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#749C75",
          height: 90, // 👈 make nav bar taller
          paddingBottom: 16, // 👈 extra space at bottom
          paddingTop: 10, // 👈 extra space at top
        },
        tabBarActiveTintColor: "#FFFAF0",
        tabBarInactiveTintColor: "#FFFAF0",
        tabBarLabelStyle: { color: "#FFFAF0" },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="newspaper.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="your-lists"
        options={{
          title: "Your Lists",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="list.bullet"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="magnifyingglass"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="trophy.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="person.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="firebase-test"
        options={{
          title: "Firebase Test",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 50 : 28}
              name="flame.fill"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
