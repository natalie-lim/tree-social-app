import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRefresh } from "@/contexts/RefreshContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import * as React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THEME = {
  cream: "#FFFAF0",
  green: "#749C75",
  outline: "#4F6E50",
};

// ---- Tunables (adjust as you like)
const BAR_HEIGHT = 106; // ↑ bar a bit so unselected icons are fully insid
const H_PADDING = 0; // edge-to-edge

const ICON_SLOT = 52; // slot around the icon (stable layout)
const ICON_GAP_FOCUSED = 8; // icon→label gap when focused
const ICON_GAP_IDLE = 4; // tighter gap when idle (your request)

const BUMP_DIAMETER = 84; // green dome size (smaller & tighter)
const INNER_DIAMETER = 64; // cream inner circle
const INNER_BORDER = 2;

const FOCUSED_ICON = 40; // focused icon size (fits inner circle)
const IDLE_ICON = 36; // idle icon size

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CurvyTabBar {...props} theme={THEME} />}
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: THEME.cream,
        tabBarInactiveTintColor: THEME.cream,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "feed",
          tabBarLabel: "feed",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="newspaper.fill"
              color={focused ? THEME.green : color}
              size={focused ? FOCUSED_ICON : IDLE_ICON}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "map",
          tabBarLabel: "map",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="map.fill"
              color={focused ? THEME.green : color}
              size={focused ? FOCUSED_ICON : IDLE_ICON}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "search",
          tabBarLabel: "search",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="leaf.fill"
              color={focused ? THEME.green : color}
              size={focused ? FOCUSED_ICON : IDLE_ICON}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "leaderboard",
          tabBarLabel: "leaderboard",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="trophy.fill"
              color={focused ? THEME.green : color}
              size={focused ? FOCUSED_ICON : IDLE_ICON}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarLabel: "profile",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="person.fill"
              color={focused ? THEME.green : color}
              size={focused ? FOCUSED_ICON : IDLE_ICON}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// -----------------------------
// Inline custom tab bar (icon-anchored bump)
// -----------------------------
function CurvyTabBar({
  state,
  descriptors,
  navigation,
  theme,
}: BottomTabBarProps & { theme: typeof THEME }) {
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useRefresh();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.green,
          paddingBottom: Math.max(6, insets.bottom - 2),
          borderTopWidth: 0,
        },
      ]}
    >
      <View style={styles.itemsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }

            // Trigger refresh when profile tab is pressed
            if (route.name === "profile") {
              refreshProfile();
            }
          };

          const color = isFocused
            ? (options.tabBarActiveTintColor as string) ?? theme.cream
            : (options.tabBarInactiveTintColor as string) ?? theme.cream;

          const text =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
              ? options.title
              : route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              activeOpacity={0.85}
              onPress={onPress}
              style={styles.item}
            >
              <View style={styles.iconSlot} pointerEvents="none">
                {isFocused && (
                  <>
                    <View
                      style={[
                        styles.bump,
                        {
                          width: BUMP_DIAMETER,
                          height: BUMP_DIAMETER,
                          borderRadius: BUMP_DIAMETER / 2,
                          left: (ICON_SLOT - BUMP_DIAMETER) / 2,
                          top: -BUMP_DIAMETER / 2 + ICON_SLOT / 2,
                          backgroundColor: theme.green,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.inner,
                        {
                          width: INNER_DIAMETER,
                          height: INNER_DIAMETER,
                          borderRadius: INNER_DIAMETER / 2,
                          left: (ICON_SLOT - INNER_DIAMETER) / 2,
                          top: -INNER_DIAMETER / 2 + ICON_SLOT / 2,
                          backgroundColor: theme.cream,
                          borderColor: theme.outline,
                          borderWidth: INNER_BORDER,
                        },
                      ]}
                    />
                  </>
                )}
                <View style={styles.iconCenter} pointerEvents="none">
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        focused: isFocused,
                        color,
                        size: isFocused ? FOCUSED_ICON : IDLE_ICON,
                      })
                    : null}
                </View>
              </View>

              <View
                style={{
                  marginTop: isFocused ? ICON_GAP_FOCUSED : ICON_GAP_IDLE,
                }}
              >
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {text}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// -----------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  bar: {
    height: BAR_HEIGHT,
    marginHorizontal: H_PADDING, // 0 for edge-to-edge
    overflow: "visible",
    borderTopWidth: 0,
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  itemsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around", // spread across full width
    paddingHorizontal: 10,
    paddingTop: 10, // push icons down slightly so idle ones sit fully inside the bar
    overflow: "visible",
  },
  item: {
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible",
  },
  iconSlot: {
    width: ICON_SLOT,
    height: ICON_SLOT,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  iconCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "lowercase",
  },
  bump: {
    position: "absolute",
    zIndex: 1,
  },
  inner: {
    position: "absolute",
    zIndex: 2,
  },
});
