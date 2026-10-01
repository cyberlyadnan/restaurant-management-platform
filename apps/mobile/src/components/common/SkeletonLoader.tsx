import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewProps } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export interface SkeletonLoaderProps extends ViewProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style,
  ...props
}: SkeletonLoaderProps) {
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceSubtle,
          opacity,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: 4,
  },
});
