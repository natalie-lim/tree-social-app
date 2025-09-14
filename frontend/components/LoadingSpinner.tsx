import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View, ViewStyle } from "react-native";

type Size = "small" | "medium" | "large";

export default function LoadingSpinner({
  bgColor = "#FFF6EC",         // app background
  green = "#2F8C46",            // your bottom-bar green (change if needed)
  size = "medium",
  fullScreen = false,           // set true to cover the screen
  style,
}: {
  bgColor?: string;
  green?: string;
  size?: Size;
  fullScreen?: boolean;
  style?: ViewStyle;
}) {
  const spin = useRef(new Animated.Value(0)).current;  // ring spin
  const sway = useRef(new Animated.Value(0)).current;  // leaf sway

  // sizes
  const SIZES: Record<Size, { icon: number; ring: number; ringWidth: number }> = {
    small:  { icon: 36, ring: 64,  ringWidth: 3 },
    medium: { icon: 56, ring: 92,  ringWidth: 3 },
    large:  { icon: 84, ring: 128, ringWidth: 4 },
  };
  const s = SIZES[size];

  useEffect(() => {
    // continuous ring rotation
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // leaf “blown” sway (gentle tilt + drift)
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [spin, sway]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const swayRotate = sway.interpolate({ inputRange: [0, 1], outputRange: ["-10deg", "10deg"] });
  const swayX = sway.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });
  const swayY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }); // tiny lift

  return (
    <View
      style={[
        fullScreen ? { ...StyleSheet.absoluteFillObject } : null,
        { backgroundColor: bgColor, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      {/* rotating ring (only green + transparent) */}
      <Animated.View
        style={{
          width: s.ring,
          height: s.ring,
          borderRadius: s.ring / 2,
          borderWidth: s.ringWidth,
          borderColor: green,
          borderTopColor: "transparent", // creates a visual “spinner” using same 2 colors
          transform: [{ rotate }],
        }}
      />

      {/* leaf centered above the ring (no extra colors) */}
      <Animated.Image
        source={require("../../assets/images/leaflogo.png")}
        resizeMode="contain"
        style={{
          position: "absolute",
          width: s.icon,
          height: s.icon,
          transform: [{ translateX: swayX }, { translateY: swayY }, { rotate: swayRotate }],
          tintColor: undefined, // keep original leaf colors; if you want it strictly 2 colors, uncomment next line:
          // tintColor: green,
        }}
      />
    </View>
  );
}
