import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const { theme } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.surfaceSubtle;
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'danger':
        return theme.colors.danger;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#ffffff';
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.textPrimary;
      default:
        return '#ffffff';
    }
  };

  const getPaddingVertical = () => {
    switch (size) {
      case 'sm':
        return 8;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 12;
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case 'sm':
        return 38;
      case 'lg':
        return 52;
      case 'md':
      default:
        return 46;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: getPaddingVertical(),
          minHeight: getMinHeight(),
          borderColor:
            variant === 'outline'
              ? disabled
                ? theme.colors.surfaceBorder
                : theme.colors.primary
              : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: theme.radius.lg,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      onPress={onPress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon ? icon : null}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
                fontWeight: '700',
              },
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    textAlign: 'center',
  },
});
