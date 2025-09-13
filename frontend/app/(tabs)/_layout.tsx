import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
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
          // Tab bar needs inline styles
          backgroundColor: "#749C75",
          height: 120,
          paddingBottom: 16,
          paddingTop: 12,
        },
        tabBarActiveTintColor: "#FFFAF0",
        tabBarInactiveTintColor: "#FFFAF0",
        tabBarLabel: ({ color, children }) => (
          <Text
            className="text-[12px] font-semibold"
            style={{ color }}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="newspaper.fill"
              color={color}
              size={focused ? 50 : 28}
              style={focused ? { marginBottom: 16 } : {}}
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
              name="list.bullet"
              color={color}
              size={focused ? 50 : 28}
              style={focused ? { marginBottom: 16 } : {}}
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
              name="magnifyingglass"
              color={color}
              size={focused ? 50 : 28}
              style={focused ? { marginBottom: 16 } : {}}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leader",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="trophy.fill"
              color={color}
              size={focused ? 50 : 28}
              style={focused ? { marginBottom: 16 } : {}}
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
              name="person.fill"
              color={color}
              size={focused ? 50 : 28}
              style={focused ? { marginBottom: 16 } : {}}
            />
          ),
        }}
      />
    </Tabs>
  );
}
