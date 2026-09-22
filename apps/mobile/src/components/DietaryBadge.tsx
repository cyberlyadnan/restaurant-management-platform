import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';

export function DietaryBadge({
  isVeg,
  size = 'md',
}: {
  isVeg: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const outerDim = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const innerDim = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;

  const borderColor = isVeg ? theme.colors.veg : theme.colors.nonVeg;
  const dotColor = isVeg ? theme.colors.veg : theme.colors.nonVeg;

  return (
    <View
      style={[
        styles.outer,
        {
          width: outerDim,
          height: outerDim,
          borderColor,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerDim,
            height: innerDim,
            borderRadius: innerDim / 2,
            backgroundColor: dotColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inner: {},
});
