import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CuteLoading } from './CuteLoading';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  showMessage?: boolean;
  variant?: 'nature' | 'dots' | 'pulse' | 'wave';
}

export function LoadingScreen({ 
  message = "Loading...", 
  size = 'medium',
  showMessage = true,
  variant = 'nature'
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <CuteLoading 
        message={message}
        size={size}
        showMessage={showMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC', // beige background
  },
});
