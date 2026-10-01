import { ArrowRight, Lock, Mail, ShieldCheck, UtensilsCrossed } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const DEMO_ACCOUNTS = [
  { role: 'Owner', email: 'owner@demo.local', pass: 'Password123!' },
  { role: 'Waiter', email: 'waiter@demo.local', pass: 'Password123!' },
  { role: 'Chef', email: 'chef@demo.local', pass: 'Password123!' },
  { role: 'Kitchen', email: 'kitchen@demo.local', pass: 'Password123!' },
  { role: 'Cashier', email: 'cashier@demo.local', pass: 'Password123!' },
];

export function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('owner@demo.local');
  const [password, setPassword] = useState('Password123!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Login failed. Check server connection.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
              <UtensilsCrossed size={32} color={theme.colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              Nodedr OrderRestro
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.colors.textMuted }]}>
              Enterprise Restaurant POS & KDS Mobile
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>
              Staff Terminal Sign In
            </Text>

            <Input
              label="Email Address"
              placeholder="staff@restaurant.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color={theme.colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color={theme.colors.textMuted} />}
            />

            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleLogin}
              fullWidth
              style={styles.loginBtn}
              icon={<ArrowRight size={18} color="#ffffff" />}
            >
              Sign In to Terminal
            </Button>
          </View>

          {/* Demo Quick-Fill Chips */}
          <View style={styles.demoSection}>
            <Text style={[styles.demoTitle, { color: theme.colors.textMuted }]}>
              Quick-fill demo roles:
            </Text>
            <View style={styles.demoGrid}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.role}
                  style={[
                    styles.demoChip,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.surfaceBorder,
                    },
                  ]}
                  onPress={() => handleQuickFill(acc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.demoChipText, { color: theme.colors.primary }]}>
                    {acc.role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Security Badge */}
          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color={theme.colors.primary} />
            <Text style={[styles.securityText, { color: theme.colors.textMuted }]}>
              Isolated Multi-Tenant Security System
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  loginBtn: {
    marginTop: 8,
  },
  demoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  demoChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
