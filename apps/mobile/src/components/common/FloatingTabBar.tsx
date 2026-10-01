import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const { isWaiter } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom + 8, 16),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
          theme.shadows.lg,
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Render prominent center action button for "+ New Order" if on Waiter stack and route is "Menu"
          const isCenterBtn = isWaiter && route.name === 'Menu';

          if (isCenterBtn) {
            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  styles.centerBtn,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                  theme.shadows.md,
                ]}
                onPress={() => navigation.navigate('Menu')}
                activeOpacity={0.8}
              >
                <Plus size={22} color="#ffffff" />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && [
                  styles.tabItemActive,
                  { backgroundColor: theme.colors.primarySoft },
                ],
              ]}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? theme.colors.primary : theme.colors.textMuted,
                size: 20,
              })}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? theme.colors.primary : theme.colors.textMuted,
                    fontWeight: isFocused ? '800' : '600',
                  },
                ]}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 16,
    gap: 2,
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 10,
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginTop: -12,
  },
});
