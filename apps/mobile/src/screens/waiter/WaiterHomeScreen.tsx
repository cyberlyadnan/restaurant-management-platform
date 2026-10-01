import type { TableStatusDto } from '@nodedr-restaurant/types';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket';
import { theme } from '../../theme';

interface TableSummary {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: TableStatusDto;
  activeOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    itemCount: number;
    status: string;
    kitchenStatus?: string;
  };
}

export function WaiterHomeScreen({ navigation }: any) {
  const { user, branchId } = useAuth();
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [networkState, setNetworkState] = useState<'ONLINE' | 'CONNECTING' | 'OFFLINE'>('ONLINE');

  const fetchSummary = async () => {
    if (!branchId) return;
    try {
      const floors = await api.get<any[]>(`/tables/floors?branchId=${branchId}`);
      const allTables: TableSummary[] = floors.flatMap((f: any) =>
        f.tables.map((t: any) => ({
          id: t.id,
          number: t.number,
          name: t.name,
          capacity: t.capacity,
          status: t.status,
          activeOrder: t.orders?.[0]
            ? {
                id: t.orders[0].id,
                orderNumber: t.orders[0].orderNumber,
                totalAmount: Number(t.orders[0].totalAmount),
                itemCount: t.orders[0].items?.length ?? 0,
                status: t.orders[0].status,
              }
            : undefined,
        })),
      );
      setTables(allTables);
    } catch (err) {
      console.log('Error fetching waiter home summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    if (branchId) {
      socketService.connect(branchId);
      const unsubState = socketService.onConnectionStateChange((state) => {
        setNetworkState(state);
      });

      const handleTableUpdated = () => fetchSummary();
      const handleOrderUpdated = () => fetchSummary();

      socketService.on('table.updated', handleTableUpdated);
      socketService.on('order.updated', handleOrderUpdated);
      socketService.on('kot.updated', handleOrderUpdated);

      return () => {
        unsubState();
        socketService.off('table.updated', handleTableUpdated);
        socketService.off('order.updated', handleOrderUpdated);
        socketService.off('kot.updated', handleOrderUpdated);
      };
    }
  }, [branchId]);

  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE');
  const foodReadyTables = tables.filter((t) => t.status === 'OCCUPIED' && t.activeOrder?.status === 'READY');

  const nowHour = new Date().getHours();
  const greeting = nowHour < 12 ? 'Good Morning' : nowHour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchSummary();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Network Connection Banner */}
      {networkState !== 'ONLINE' && (
        <View
          style={[
            styles.networkBanner,
            { backgroundColor: networkState === 'CONNECTING' ? theme.colors.warning : theme.colors.danger },
          ]}
        >
          <Text style={styles.networkBannerText}>
            {networkState === 'CONNECTING' ? '⚡ Reconnecting live network...' : '⚠️ Offline Mode — Check Connection'}
          </Text>
        </View>
      )}

      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userName}>{user?.name ?? 'Waiter'}</Text>
        </View>

        <TouchableOpacity
          style={styles.badgeBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.badgeBtnText}>🔔 Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Food Ready Urgent Action Banner */}
      {foodReadyTables.length > 0 && (
        <TouchableOpacity
          style={styles.readyBanner}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.8}
        >
          <View style={styles.readyBannerContent}>
            <Text style={styles.readyBannerTitle}>🔥 FOOD READY FOR PICKUP!</Text>
            <Text style={styles.readyBannerSub}>
              {foodReadyTables.length} table(s) have orders ready in the kitchen
            </Text>
          </View>
          <View style={styles.readyBannerTag}>
            <Text style={styles.readyBannerTagText}>Serve Now ➔</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Actionable Overview Metrics */}
      <Text style={styles.sectionTitle}>What do you need to do right now?</Text>

      <View style={styles.metricsGrid}>
        <TouchableOpacity
          style={[styles.metricCard, { borderColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Tables')}
        >
          <Text style={styles.metricVal}>{occupiedTables.length}</Text>
          <Text style={styles.metricLabel}>Occupied Tables</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderColor: theme.colors.warning }]}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={styles.metricVal}>{foodReadyTables.length}</Text>
          <Text style={styles.metricLabel}>Ready to Serve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderColor: theme.colors.info }]}
          onPress={() => navigation.navigate('Tables')}
        >
          <Text style={styles.metricVal}>{availableTables.length}</Text>
          <Text style={styles.metricLabel}>Free Tables</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Access Active Tables */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Active Seated Tables</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tables')}>
          <Text style={styles.seeAllText}>View All Tables ➔</Text>
        </TouchableOpacity>
      </View>

      {occupiedTables.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>No active seated tables</Text>
          <Text style={styles.emptySub}>Tap &quot;Tables&quot; below to seat walk-in guests or start a new order.</Text>
        </View>
      ) : (
        occupiedTables.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.tableCard}
            onPress={() => navigation.navigate('Menu', { tableId: t.id, tableName: t.name || `Table ${t.number}` })}
            activeOpacity={0.7}
          >
            <View style={styles.tableCardHeader}>
              <View style={styles.tableNumberBadge}>
                <Text style={styles.tableNumberText}>T-{t.number}</Text>
              </View>

              <View style={styles.tableStatusTag}>
                <Text style={styles.tableStatusText}>
                  {t.activeOrder?.status === 'READY' ? '🟢 FOOD READY' : '🟠 IN PREPARATION'}
                </Text>
              </View>
            </View>

            <View style={styles.tableCardBody}>
              <Text style={styles.tableMetaText}>👥 {t.capacity} Guests</Text>
              {t.activeOrder && (
                <Text style={styles.tablePriceText}>₹{t.activeOrder.totalAmount.toLocaleString()}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
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
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  networkBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  networkBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greetingText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  userName: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  badgeBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  badgeBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  readyBanner: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  readyBannerContent: {
    flex: 1,
  },
  readyBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  readyBannerSub: {
    color: '#ffedd5',
    fontSize: 11,
    marginTop: 2,
  },
  readyBannerTag: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  readyBannerTagText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  metricVal: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginTop: theme.spacing.sm,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: theme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginBottom: theme.spacing.sm,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNumberBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  tableNumberText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  tableStatusTag: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  tableStatusText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  tableCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  tableMetaText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tablePriceText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
