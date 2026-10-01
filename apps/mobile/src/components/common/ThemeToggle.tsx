import { Monitor, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeMode, useAppTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { themeMode, setThemeMode, theme } = useAppTheme();

  const modes: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { key: 'light', label: 'Light', icon: <Sun size={14} color={themeMode === 'light' ? '#ffffff' : theme.colors.textMuted} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={14} color={themeMode === 'dark' ? '#ffffff' : theme.colors.textMuted} /> },
    { key: 'system', label: 'System', icon: <Monitor size={14} color={themeMode === 'system' ? '#ffffff' : theme.colors.textMuted} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceSubtle, borderColor: theme.colors.surfaceBorder }]}>
      {modes.map((m) => {
        const isActive = themeMode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.option,
              isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
            ]}
            onPress={() => setThemeMode(m.key)}
            activeOpacity={0.8}
          >
            {m.icon}
            <Text
              style={[
                styles.text,
                { color: isActive ? '#ffffff' : theme.colors.textMuted },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 4,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
