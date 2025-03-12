import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedView } from './ThemedView';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'large', 
  color = '#000' 
}) => {
  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // semi-transparent background
  },
}); 