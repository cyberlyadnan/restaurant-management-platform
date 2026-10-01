import type { TableStatusDto } from '@nodedr-restaurant/types';
import { Bell, ChevronRight, Flame, Users, Utensils, Wifi, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socket';

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
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

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
  const foodReadyTables = tables.filter(
    (t) => t.status === 'OCCUPIED' && t.activeOrder?.status === 'READY',
  );

  const nowHour = new Date().getHours();
  const greeting =
    nowHour < 12 ? 'Good Morning' : nowHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 },
      ]}
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
      {/* Network Connection Status Banner */}
      {networkState !== 'ONLINE' && (
        <View
          style={[
            styles.networkBanner,
            {
              backgroundColor:
                networkState === 'CONNECTING' ? theme.colors.warning : theme.colors.danger,
            },
          ]}
        >
          {networkState === 'CONNECTING' ? (
            <Wifi size={14} color="#ffffff" />
          ) : (
            <WifiOff size={14} color="#ffffff" />
          )}
          <Text style={styles.networkBannerText}>
            {networkState === 'CONNECTING'
              ? 'Reconnecting live network...'
              : 'Offline Mode — Reconnecting...'}
          </Text>
        </View>
      )}

      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingText, { color: theme.colors.textMuted }]}>
            {greeting},
          </Text>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
            {user?.name ?? 'Waiter'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.badgeBtn,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Bell size={16} color={theme.colors.textPrimary} />
          <Text style={[styles.badgeBtnText, { color: theme.colors.textPrimary }]}>
            Alerts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Food Ready Urgent Action Banner */}
      {foodReadyTables.length > 0 && (
        <TouchableOpacity
          style={[styles.readyBanner, { backgroundColor: theme.colors.secondary }]}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.8}
        >
          <View style={styles.readyBannerContent}>
            <View style={styles.readyTitleRow}>
              <Flame size={18} color="#ffffff" />
              <Text style={styles.readyBannerTitle}>FOOD READY FOR PICKUP!</Text>
            </View>
            <Text style={styles.readyBannerSub}>
              {foodReadyTables.length} table(s) have orders ready in the kitchen
            </Text>
          </View>
          <View style={styles.readyBannerTag}>
            <Text style={styles.readyBannerTagText}>Serve Now</Text>
            <ChevronRight size={14} color={theme.colors.secondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Actionable Overview Metrics */}
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        What do you need to do right now?
      </Text>

      {loading && !refreshing ? (
        <View style={styles.metricsGrid}>
          <SkeletonLoader height={70} borderRadius={14} width="30%" />
          <SkeletonLoader height={70} borderRadius={14} width="30%" />
          <SkeletonLoader height={70} borderRadius={14} width="30%" />
        </View>
      ) : (
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => navigation.navigate('Tables')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
              {occupiedTables.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              Occupied Tables
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.warning,
              },
            ]}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
              {foodReadyTables.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              Ready to Serve
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.info,
              },
            ]}
            onPress={() => navigation.navigate('Tables')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
              {availableTables.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
              Free Tables
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Access Active Tables */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Your Active Seated Tables
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Tables')}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
            View All Layout
          </Text>
          <ChevronRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={{ gap: 10 }}>
          <SkeletonLoader height={80} borderRadius={14} />
          <SkeletonLoader height={80} borderRadius={14} />
        </View>
      ) : occupiedTables.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <Utensils size={36} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            No active seated tables
          </Text>
          <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
            Tap &quot;Tables&quot; below to seat walk-in guests or start a new order.
          </Text>
        </View>
      ) : (
        occupiedTables.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.tableCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
            onPress={() =>
              navigation.navigate('Menu', {
                tableId: t.id,
                tableName: t.name || `Table ${t.number}`,
              })
            }
            activeOpacity={0.75}
          >
            <View style={styles.tableCardHeader}>
              <View style={[styles.tableNumberBadge, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.tableNumberText, { color: theme.colors.primaryDark }]}>
                  T-{t.number}
                </Text>
              </View>

              <StatusBadge
                status={t.activeOrder?.status === 'READY' ? 'READY' : 'PREPARING'}
                label={t.activeOrder?.status === 'READY' ? 'FOOD READY' : 'PREPARING'}
                size="sm"
              />
            </View>

            <View style={styles.tableCardBody}>
              <View style={styles.guestRow}>
                <Users size={14} color={theme.colors.textMuted} />
                <Text style={[styles.tableMetaText, { color: theme.colors.textMuted }]}>
                  {t.capacity} Guests
                </Text>
              </View>

              {t.activeOrder && (
                <Text style={[styles.tablePriceText, { color: theme.colors.textPrimary }]}>
                  ₹{t.activeOrder.totalAmount.toLocaleString()}
                </Text>
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
  },
  content: {
    paddingHorizontal: 16,
  },
  networkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
    justifyContent: 'center',
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
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
  },
  badgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  readyBanner: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  readyBannerContent: {
    flex: 1,
  },
  readyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyBannerTagText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  tableCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableNumberText: {
    fontSize: 13,
    fontWeight: '800',
  },
  tableCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tablePriceText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
