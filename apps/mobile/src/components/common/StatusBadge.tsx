import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const { theme } = useAppTheme();

  const getStyle = () => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return {
          bg: theme.colors.primarySoft,
          color: theme.colors.primary,
          border: theme.colors.primary,
        };
      case 'OCCUPIED':
      case 'IN_PROGRESS':
      case 'PREPARING':
        return {
          bg: theme.colors.warningLight,
          color: theme.colors.warning,
          border: theme.colors.warning,
        };
      case 'FOOD READY':
      case 'READY':
      case 'SUCCESS':
      case 'PAID':
        return {
          bg: theme.colors.successLight,
          color: theme.colors.success,
          border: theme.colors.success,
        };
      case 'BILL REQUESTED':
      case 'BILL_REQUESTED':
      case 'NEW':
      case 'RUSH':
        return {
          bg: theme.colors.secondaryLight,
          color: theme.colors.secondary,
          border: theme.colors.secondary,
        };
      case 'CANCELLED':
      case 'FAILED':
      case 'OFFLINE':
        return {
          bg: theme.colors.dangerLight,
          color: theme.colors.danger,
          border: theme.colors.danger,
        };
      default:
        return {
          bg: theme.colors.surfaceSubtle,
          color: theme.colors.textMuted,
          border: theme.colors.surfaceBorder,
        };
    }
  };

  const config = getStyle();
  const displayText = label || status;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingHorizontal: size === 'sm' ? 6 : 8,
          paddingVertical: size === 'sm' ? 2 : 4,
          borderRadius: theme.radius.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: size === 'sm' ? 9 : 11,
          },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
