import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { ThemedView } from './ThemedView';

interface LoadingSpinnerProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  dotColor?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 70,
  primaryColor = '#ffa516',
  secondaryColor = 'green',
  dotColor = '#ccc'
}) => {
  const rotateAnim = new Animated.Value(0);
  const dotRotateAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(dotRotateAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotSpin = dotRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View 
        style={[
          styles.loaderContainer, 
          { 
            width: size, 
            height: size,
            transform: [{ rotate: spin }]
          }
        ]}
      >
        <View style={[styles.circle, { backgroundColor: primaryColor, width: size * 0.23, height: size * 0.23 }]} />
        <View style={[styles.circle2, { backgroundColor: secondaryColor, width: size * 0.17, height: size * 0.17 }]} />
        <Animated.View 
          style={[
            styles.dot, 
            { 
              backgroundColor: dotColor,
              width: size * 0.11,
              height: size * 0.11,
              bottom: size * 0.23,
              transform: [{ rotate: dotSpin }]
            }
          ]} 
        />
      </Animated.View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loaderContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
  },
  circle2: {
    position: 'absolute',
    borderRadius: 999,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ translateY: -10 }],
  },
}); 