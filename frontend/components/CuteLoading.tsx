import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';

const { width: screenWidth } = Dimensions.get('window');

interface CuteLoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
}

const THEME = {
  bg: '#F5F5DC', // beige background
  primary: '#2D5016', // dark green
  secondary: '#228B22', // forest green
  accent: '#32CD32', // lime green
  text: '#1E3A0F', // darker green
  textSecondary: '#2D5016',
};

export function CuteLoading({ 
  message = "Loading...", 
  size = 'medium',
  showMessage = true 
}: CuteLoadingProps) {
  const leafAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const dotsAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Leaf rotation animation
    const leafRotate = Animated.loop(
      Animated.timing(leafAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for the main circle
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Bounce animation for the container
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Dots animation
    const dots = Animated.loop(
      Animated.timing(dotsAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    leafRotate.start();
    pulse.start();
    bounce.start();
    dots.start();

    return () => {
      leafRotate.stop();
      pulse.stop();
      bounce.stop();
      dots.stop();
    };
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small': return { container: 60, leaf: 30, text: 14 };
      case 'large': return { container: 120, leaf: 60, text: 18 };
      default: return { container: 80, leaf: 40, text: 16 };
    }
  };

  const sizes = getSize();

  const leafRotation = leafAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotsOpacity = dotsAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.loadingContainer,
          {
            transform: [
              { translateY: bounceAnimation },
              { scale: pulseAnimation }
            ]
          }
        ]}
      >
        {/* Main circle with gradient effect */}
        <View style={[styles.mainCircle, { width: sizes.container, height: sizes.container }]}>
          <View style={[styles.innerCircle, { width: sizes.container * 0.7, height: sizes.container * 0.7 }]}>
            {/* Rotating leaf */}
            <Animated.View
              style={[
                styles.leafContainer,
                {
                  transform: [{ rotate: leafRotation }],
                  width: sizes.leaf,
                  height: sizes.leaf,
                }
              ]}
            >
              <Text style={[styles.leaf, { fontSize: sizes.leaf }]}>🍃</Text>
            </Animated.View>
          </View>
        </View>

        {/* Floating particles */}
        <View style={styles.particles}>
          <View style={[styles.particle, styles.particle1]} />
          <View style={[styles.particle, styles.particle2]} />
          <View style={[styles.particle, styles.particle3]} />
        </View>
      </Animated.View>

      {showMessage && (
        <View style={styles.messageContainer}>
          <ThemedText style={[styles.message, { fontSize: sizes.text }]}>
            {message}
          </ThemedText>
          <View style={styles.dotsContainer}>
            <Animated.Text style={[styles.dots, { opacity: dotsOpacity }]}>
              ●●●
            </Animated.Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainCircle: {
    borderRadius: 50,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  innerCircle: {
    borderRadius: 50,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.secondary,
  },
  leafContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    textAlign: 'center',
  },
  particles: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accent,
  },
  particle1: {
    top: 10,
    left: 20,
    opacity: 0.7,
  },
  particle2: {
    top: 30,
    right: 15,
    opacity: 0.5,
  },
  particle3: {
    bottom: 20,
    left: 30,
    opacity: 0.6,
  },
  messageContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  message: {
    color: THEME.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  dotsContainer: {
    height: 20,
    justifyContent: 'center',
  },
  dots: {
    color: THEME.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
