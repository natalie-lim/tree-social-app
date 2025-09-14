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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
}

const THEME = {
  bg: '#F5F5DC', // beige background
  primary: '#2D5016', // dark green
  secondary: '#228B22', // forest green
  accent: '#32CD32', // lime green
  text: '#1E3A0F', // darker green
  textSecondary: '#2D5016',
};

export function SplashScreen({ 
  onAnimationComplete,
  duration = 3000 
}: SplashScreenProps) {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.5)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const startAnimations = () => {
      // Fade in animation
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Scale animation
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Slide up animation
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Complete animation after duration
      setTimeout(() => {
        onAnimationComplete?.();
      }, duration);
    };

    startAnimations();
  }, [duration, onAnimationComplete]);

  const rotateInterpolation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnimation,
            transform: [
              { scale: scaleAnimation },
              { translateY: slideAnimation }
            ]
          }
        ]}
      >
        {/* Rotating leaf container */}
        <Animated.View
          style={[
            styles.leafContainer,
            {
              transform: [{ rotate: rotateInterpolation }]
            }
          ]}
        >
          <View style={styles.leafCircle}>
            <Text style={styles.leaf}>🍃</Text>
          </View>
        </Animated.View>

        {/* App title */}
        <ThemedText style={styles.title}>Leaflet</ThemedText>
        <ThemedText style={styles.subtitle}>Discover Nature Together</ThemedText>

        {/* Floating particles */}
        <View style={styles.particles}>
          <View style={[styles.particle, styles.particle1]} />
          <View style={[styles.particle, styles.particle2]} />
          <View style={[styles.particle, styles.particle3]} />
          <View style={[styles.particle, styles.particle4]} />
        </View>
      </Animated.View>

      {/* Bottom loading indicator */}
      <Animated.View 
        style={[
          styles.loadingIndicator,
          { opacity: fadeAnimation }
        ]}
      >
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: THEME.bg,
    opacity: 0.8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  leafContainer: {
    marginBottom: 30,
  },
  leafCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  leaf: {
    fontSize: 60,
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  particles: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.accent,
  },
  particle1: {
    top: 20,
    left: 30,
    opacity: 0.6,
  },
  particle2: {
    top: 40,
    right: 20,
    opacity: 0.4,
  },
  particle3: {
    bottom: 30,
    left: 40,
    opacity: 0.5,
  },
  particle4: {
    bottom: 50,
    right: 30,
    opacity: 0.3,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.secondary,
  },
  dot1: {
    opacity: 0.6,
  },
  dot2: {
    opacity: 0.8,
  },
  dot3: {
    opacity: 0.4,
  },
});
