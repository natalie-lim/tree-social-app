import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { View, StyleSheet } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const isSelected = props.accessibilityState?.selected;
  
  return (
    <View style={styles.tabContainer}>
      {isSelected && <View style={styles.halfCircle} />}
      <PlatformPressable
        {...props}
        style={[props.style, styles.pressable]}
        onPressIn={(ev) => {
          if (process.env.EXPO_OS === 'ios') {
            // Add a soft haptic feedback when pressing down on the tabs.
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          props.onPressIn?.(ev);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    width: 80,
    height: 40,
    backgroundColor: '#4A7C59',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: -1,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
