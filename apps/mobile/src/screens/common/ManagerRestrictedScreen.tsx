import { LogOut, ShieldAlert } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export function ManagerRestrictedScreen() {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
        >
          <ShieldAlert size={32} color={theme.colors.warning} />
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Mobile App is Staff-Optimized
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
          Welcome, {user?.name || 'Manager'}
        </Text>

        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          The mobile application is purpose-built for fast operational workflows (Waiters & Kitchen KDS staff).
        </Text>

        <View
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <Text style={[styles.boxTitle, { color: theme.colors.textPrimary }]}>
            🔑 Administrative Dashboard Access
          </Text>
          <Text style={[styles.boxText, { color: theme.colors.textMuted }]}>
            To access owner analytics, financial statements, menu configuration, inventory management, and platform settings, please open the Web Application in your desktop browser.
          </Text>
        </View>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onPress={logout}
          icon={<LogOut size={16} color="#ffffff" />}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  body: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  box: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  boxText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
