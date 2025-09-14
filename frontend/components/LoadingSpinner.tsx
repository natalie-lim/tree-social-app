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

interface LoadingSpinnerProps {
  message?: string;
  variant?: 'nature' | 'dots' | 'pulse' | 'wave';
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

export function LoadingSpinner({ 
  message = "Loading...", 
  variant = 'nature',
  size = 'medium',
  showMessage = true 
}: LoadingSpinnerProps) {
  const animation1 = useRef(new Animated.Value(0)).current;
  const animation2 = useRef(new Animated.Value(0)).current;
  const animation3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, duration: number, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    let animations: Animated.CompositeAnimation[] = [];

    switch (variant) {
      case 'nature':
        animations = [
          createAnimation(animation1, 2000),
          createAnimation(animation2, 1500, 500),
          createAnimation(animation3, 1000, 1000),
        ];
        break;
      case 'dots':
        animations = [
          createAnimation(animation1, 600),
          createAnimation(animation2, 600, 200),
          createAnimation(animation3, 600, 400),
        ];
        break;
      case 'pulse':
        animations = [
          createAnimation(animation1, 1000),
        ];
        break;
      case 'wave':
        animations = [
          createAnimation(animation1, 1200),
          createAnimation(animation2, 1200, 300),
          createAnimation(animation3, 1200, 600),
        ];
        break;
    }

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [variant]);

  const getSize = () => {
    switch (size) {
      case 'small': return { container: 40, text: 12 };
      case 'large': return { container: 80, text: 18 };
      default: return { container: 60, text: 14 };
    }
  };

  const sizes = getSize();

  const renderNatureSpinner = () => (
    <View style={[styles.natureContainer, { width: sizes.container * 2, height: sizes.container * 2 }]}>
      <Animated.View
        style={[
          styles.natureLeaf,
          {
            transform: [
              { rotate: animation1.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })},
              { scale: animation1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.2, 1],
              })}
            ]
          }
        ]}
      >
        <Text style={[styles.leaf, { fontSize: sizes.container }]}>🍃</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.natureLeaf,
          {
            transform: [
              { rotate: animation2.interpolate({
                inputRange: [0, 1],
                outputRange: ['120deg', '480deg'],
              })},
              { scale: animation2.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1.1, 0.8],
              })}
            ]
          }
        ]}
      >
        <Text style={[styles.leaf, { fontSize: sizes.container * 0.7 }]}>🌿</Text>
      </Animated.View>
    </View>
  );

  const renderDotsSpinner = () => (
    <View style={styles.dotsContainer}>
      {[animation1, animation2, animation3].map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: sizes.container / 4,
              height: sizes.container / 4,
              backgroundColor: THEME.secondary,
              transform: [
                { scale: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 0.5],
                })},
                { translateY: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -10, 0],
                })}
              ]
            }
          ]}
        />
      ))}
    </View>
  );

  const renderPulseSpinner = () => (
    <Animated.View
      style={[
        styles.pulseContainer,
        {
          width: sizes.container,
          height: sizes.container,
          transform: [
            { scale: animation1.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.3, 1],
            })}
          ]
        }
      ]}
    >
      <View style={[styles.pulseInner, { width: sizes.container * 0.6, height: sizes.container * 0.6 }]}>
        <Text style={[styles.leaf, { fontSize: sizes.container * 0.4 }]}>🌱</Text>
      </View>
    </Animated.View>
  );

  const renderWaveSpinner = () => (
    <View style={styles.waveContainer}>
      {[animation1, animation2, animation3].map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              width: sizes.container / 6,
              height: sizes.container,
              backgroundColor: THEME.accent,
              transform: [
                { scaleY: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                })}
              ]
            }
          ]}
        />
      ))}
    </View>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'nature': return renderNatureSpinner();
      case 'dots': return renderDotsSpinner();
      case 'pulse': return renderPulseSpinner();
      case 'wave': return renderWaveSpinner();
      default: return renderNatureSpinner();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.spinnerContainer}>
        {renderSpinner()}
      </View>
      
      {showMessage && (
        <View style={styles.messageContainer}>
          <ThemedText style={[styles.message, { fontSize: sizes.text }]}>
            {message}
          </ThemedText>
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
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Nature spinner styles
  natureContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  natureLeaf: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    textAlign: 'center',
  },
  // Dots spinner styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 50,
  },
  // Pulse spinner styles
  pulseContainer: {
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
  pulseInner: {
    borderRadius: 50,
    backgroundColor: THEME.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.secondary,
  },
  // Wave spinner styles
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  waveBar: {
    borderRadius: 2,
  },
  // Message styles
  messageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  message: {
    color: THEME.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
