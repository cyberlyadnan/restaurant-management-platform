import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { DEFAULT_API_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export function SettingsScreen() {
  const { user, branchId, branches, selectBranch, logout } = useAuth();
  const [customServerUrl, setCustomServerUrl] = useState(DEFAULT_API_URL || '');

  const handleSaveServerUrl = async () => {
    if (!customServerUrl.trim()) return;
    await api.setBaseUrl(customServerUrl.trim());
    Alert.alert('Saved', 'Server API URL updated. Please re-login if needed.');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App & Branch Settings</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.slice(0, 2).toUpperCase() ?? 'ST'}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name ?? 'Staff User'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.roleName ?? 'Staff Member'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Branch Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Active Branch</Text>
          <View style={styles.branchList}>
            {branches.map((b) => {
              const isSelected = b.id === branchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchItem, isSelected && styles.branchItemActive]}
                  onPress={() => selectBranch(b.id)}
                >
                  <Text style={[styles.branchName, isSelected && styles.branchNameActive]}>
                    {b.name}
                  </Text>
                  {isSelected && <Text style={styles.activeCheck}>✓ Active</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Server Endpoint Config */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Backend Server Address</Text>
          <Text style={styles.sectionDesc}>
            For Android emulator use 10.0.2.2:4000. For physical phone use your computer LAN IP.
          </Text>
          <TextInput
            style={styles.serverInput}
            value={customServerUrl}
            onChangeText={setCustomServerUrl}
            placeholder="http://192.168.1.X:4000/api/v1"
            placeholderTextColor={theme.colors.textDim}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveServerUrl}>
            <Text style={styles.saveBtnText}>Update Server Endpoint</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out from Terminal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  userName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  sectionDesc: {
    color: theme.colors.textDim,
    fontSize: 11,
    marginBottom: theme.spacing.sm,
    lineHeight: 15,
  },
  branchList: {
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  branchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  branchItemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#064e3b25',
  },
  branchName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  branchNameActive: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  activeCheck: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  serverInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    color: theme.colors.text,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.sm,
  },
  saveBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingVertical: 9,
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#7f1d1d20',
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
