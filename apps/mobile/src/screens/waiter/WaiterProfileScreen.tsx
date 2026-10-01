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

export function WaiterProfileScreen() {
  const { user, branchId, branches, selectBranch, logout, isOwnerOrManager } = useAuth();

  const currentBranch = branches.find((b) => b.id === branchId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'S'}</Text>
        </View>

        <Text style={styles.userName}>{user?.name || 'Staff User'}</Text>
        <Text style={styles.userRole}>
          {user?.roleName || 'Operational Staff'}
        </Text>
      </View>

      {/* Owner / Manager Restricted Notice */}
      {isOwnerOrManager && (
        <View style={styles.managerNoticeCard}>
          <Text style={styles.noticeTitle}>ℹ️ Operational Staff Mode</Text>
          <Text style={styles.noticeBody}>
            You are logged in with an Administrative / Owner account. Mobile access is optimized for fast restaurant staff operations (Waiters & Kitchen KDS).
          </Text>
          <Text style={styles.noticeSub}>
            For full management analytics, inventory control, and financial reporting, please access the Web Dashboard from your laptop or desktop browser.
          </Text>
        </View>
      )}

      {/* Branch Selector Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Active Restaurant Branch</Text>
        <Text style={styles.sectionDesc}>Select the physical location terminal you are operating:</Text>

        <View style={styles.branchList}>
          {branches.map((b) => {
            const isSelected = b.id === branchId;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.branchRow, isSelected && styles.branchRowSelected]}
                onPress={() => selectBranch(b.id)}
              >
                <View style={styles.radioDotOuter}>
                  <View style={[styles.radioDotInner, isSelected && styles.radioDotActive]} />
                </View>

                <Text style={[styles.branchName, isSelected && styles.branchNameSelected]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* App Info & Sign Out */}
      <View style={styles.sectionCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>App Version</Text>
          <Text style={styles.infoVal}>v2.4.0 (Staff Mobile)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Active Terminal</Text>
          <Text style={styles.infoVal}>{currentBranch?.name || 'Main Branch'}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Sign Out of Terminal</Text>
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
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  userRole: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  managerNoticeCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    marginBottom: theme.spacing.lg,
  },
  noticeTitle: {
    color: theme.colors.warning,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  noticeBody: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  noticeSub: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  branchList: {
    gap: 8,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  branchRowSelected: {
    borderColor: theme.colors.primary,
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioDotActive: {
    backgroundColor: theme.colors.primary,
  },
  branchName: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  branchNameSelected: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  infoKey: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
