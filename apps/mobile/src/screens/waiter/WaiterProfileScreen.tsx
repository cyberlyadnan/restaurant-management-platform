import { Check, Info, LogOut, Store, User } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export function WaiterProfileScreen() {
  const { user, branchId, branches, selectBranch, logout, isOwnerOrManager } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const currentBranch = branches.find((b) => b.id === branchId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 },
      ]}
    >
      {/* Header Profile */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'S'}
          </Text>
        </View>

        <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
          {user?.name || 'Staff User'}
        </Text>
        <Text style={[styles.userRole, { color: theme.colors.textMuted }]}>
          {user?.roleName || 'Operational Staff'}
        </Text>
      </View>

      {/* Theme Preference Switcher Card */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Appearance Mode
        </Text>
        <Text style={[styles.sectionDesc, { color: theme.colors.textMuted }]}>
          Select your preferred mobile application color theme:
        </Text>
        <ThemeToggle />
      </View>

      {/* Owner / Manager Restricted Notice */}
      {isOwnerOrManager && (
        <View
          style={[
            styles.managerNoticeCard,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.warning,
            },
          ]}
        >
          <View style={styles.noticeTitleRow}>
            <Info size={16} color={theme.colors.warning} />
            <Text style={[styles.noticeTitle, { color: theme.colors.warning }]}>
              Operational Staff Mode Active
            </Text>
          </View>
          <Text style={[styles.noticeBody, { color: theme.colors.textPrimary }]}>
            You are logged in with an Administrative account. Mobile access is optimized for fast restaurant staff operations (Waiters & Kitchen KDS).
          </Text>
          <Text style={[styles.noticeSub, { color: theme.colors.textMuted }]}>
            For full management analytics, inventory control, and financial reporting, please access the Web Dashboard from your laptop or desktop browser.
          </Text>
        </View>
      )}

      {/* Branch Selector Card */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Store size={16} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Active Restaurant Branch
          </Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.colors.textMuted }]}>
          Select the physical location terminal you are operating:
        </Text>

        <View style={styles.branchList}>
          {branches.map((b) => {
            const isSelected = b.id === branchId;
            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.branchRow,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                  },
                ]}
                onPress={() => selectBranch(b.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioDotOuter,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surfaceBorder,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDotInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.branchName,
                    {
                      color: isSelected
                        ? theme.colors.textPrimary
                        : theme.colors.textMuted,
                      fontWeight: isSelected ? '800' : '500',
                    },
                  ]}
                >
                  {b.name}
                </Text>

                {isSelected && <Check size={16} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* App Info & Sign Out */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
          },
        ]}
      >
        <View style={[styles.infoRow, { borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.infoKey, { color: theme.colors.textMuted }]}>
            App Version
          </Text>
          <Text style={[styles.infoVal, { color: theme.colors.textPrimary }]}>
            v2.5.0 (Staff Mobile)
          </Text>
        </View>

        <View style={[styles.infoRow, { borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.infoKey, { color: theme.colors.textMuted }]}>
            Active Terminal
          </Text>
          <Text style={[styles.infoVal, { color: theme.colors.textPrimary }]}>
            {currentBranch?.name || 'Main Branch'}
          </Text>
        </View>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onPress={logout}
          style={styles.logoutBtn}
          icon={<LogOut size={16} color="#ffffff" />}
        >
          Sign Out of Terminal
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
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  managerNoticeCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  noticeSub: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  branchList: {
    gap: 8,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  branchName: {
    flex: 1,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoKey: {
    fontSize: 12,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: 16,
  },
});
