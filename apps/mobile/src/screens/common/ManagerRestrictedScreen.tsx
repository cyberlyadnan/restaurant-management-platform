import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

export function ManagerRestrictedScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📱</Text>
        </View>

        <Text style={styles.title}>Mobile App is Staff-Optimized</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.name || 'Manager'}
        </Text>

        <Text style={styles.body}>
          The mobile application is purpose-built for fast operational workflows (Waiters & Kitchen KDS staff).
        </Text>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>🔑 Administrative Dashboard Access</Text>
          <Text style={styles.boxText}>
            To access owner analytics, financial statements, menu configuration, inventory management, and platform settings, please open the Web Application in your desktop browser.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  box: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  boxTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  boxText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  logoutBtn: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
