import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "./themed-text";

interface CuteLoadingProps {
  message?: string;
  size?: "small" | "medium" | "large";
  showMessage?: boolean;
}

const THEME = {
  bg: "#FFF6EC",     // background color
  green: "#2F8C46",  // bottom-bar green
};

export function CuteLoading({
  message = "Loading...",
  size = "medium",
  showMessage = true,
}: CuteLoadingProps) {
  // Animations
  const ringSpin = useRef(new Animated.Value(0)).current;   // outer ring rotation
  const leafSway = useRef(new Animated.Value(0)).current;   // leaf sway
  const bgSpin  = useRef(new Animated.Value(0)).current;    // background image rotation
  const bgPulse = useRef(new Animated.Value(0)).current;    // background image scale/opacity

  useEffect(() => {
    // Ring: constant rotation
    Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Leaf: gentle sway
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafSway, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(leafSway, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Background solar wind: slow spin
    Animated.loop(
      Animated.timing(bgSpin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Background solar wind: subtle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgPulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [ringSpin, leafSway, bgSpin, bgPulse]);

  // Sizes
  const SIZES: Record<NonNullable<CuteLoadingProps["size"]>, { ring: number; ringW: number; icon: number; text: number; bg: number }> = {
    small:  { ring: 64,  ringW: 3, icon: 36, text: 12, bg: 56 },
    medium: { ring: 92,  ringW: 3, icon: 56, text: 14, bg: 84 },
    large:  { ring: 128, ringW: 4, icon: 84, text: 16, bg: 116 },
  };
  const s = SIZES[size];

  // Interpolations
  const ringRotate = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const leafRotate = leafSway.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "12deg"] });
  const leafShiftX = leafSway.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });

  const bgRotate = bgSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const bgScale  = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const bgOpacity = bgPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });

  return (
    <View style={[styles.root, { backgroundColor: THEME.bg }]}>
      {/* Wrapper ensures perfect centering of all layers */}
      <View style={[styles.wrapper, { width: s.ring, height: s.ring }]}>
        {/* Rotating ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: s.ring,
              height: s.ring,
              borderRadius: s.ring / 2,
              borderWidth: s.ringW,
              borderColor: THEME.green,
              borderTopColor: "transparent",
              transform: [{ rotate: ringRotate }],
            },
          ]}
        />

        {/* Centered, swaying leaf */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: leafShiftX }, { rotate: leafRotate }],
          }}
        >
          <Ionicons name="leaf" size={s.icon} color={THEME.green} />
        </Animated.View>
      </View>

      {showMessage && (
        <View style={{ marginTop: 16 }}>
          <ThemedText style={{ color: THEME.green, fontWeight: "600", fontSize: s.text, textAlign: "center" }}>
            {message}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  bgImg: {
    position: "absolute",
  },
});
