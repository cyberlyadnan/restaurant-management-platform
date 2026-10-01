import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { KitchenTicketCard, KotTicketItem } from '../../components/KitchenTicketCard';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket';
import { theme } from '../../theme';

const KITCHEN_TABS = ['ALL', 'NEW', 'PREPARING', 'READY'] as const;

export function KitchenHomeScreen({ navigation }: any) {
  const { branchId, logout, user } = useAuth();
  const [tickets, setTickets] = useState<KotTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<(typeof KITCHEN_TABS)[number]>('ALL');
  const [networkState, setNetworkState] = useState<'ONLINE' | 'CONNECTING' | 'OFFLINE'>('ONLINE');

  const fetchTickets = async () => {
    if (!branchId) return;
    try {
      const res = await api.get<any[]>(`/kds/tickets?branchId=${branchId}`);
      const mapped: KotTicketItem[] = (res || []).map((t) => ({
        id: t.id,
        orderNumber: t.orderNumber || t.order?.orderNumber || 'KOT',
        tableName: t.order?.table?.number,
        orderType: t.order?.orderType || 'DINE_IN',
        status: t.status,
        isPriority: t.isPriority,
        notes: t.notes,
        createdAt: t.createdAt,
        items: (t.items || []).map((i: any) => ({
          id: i.id,
          name: i.menuItem?.name || i.name || 'Item',
          quantity: i.quantity,
          notes: i.notes,
          modifiers: i.modifiers || [],
        })),
      }));
      setTickets(mapped);
    } catch (err) {
      console.log('Failed to fetch KDS tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    if (branchId) {
      socketService.connect(branchId);
      const unsubState = socketService.onConnectionStateChange((st) => setNetworkState(st));

      const handleUpdate = () => fetchTickets();
      socketService.on('kot.created', handleUpdate);
      socketService.on('kot.updated', handleUpdate);
      socketService.on('order.updated', handleUpdate);

      return () => {
        unsubState();
        socketService.off('kot.created', handleUpdate);
        socketService.off('kot.updated', handleUpdate);
        socketService.off('order.updated', handleUpdate);
      };
    }
  }, [branchId]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    if (!branchId) return;
    try {
      await api.put(`/kds/tickets/${ticketId}/status?branchId=${branchId}`, {
        status: newStatus,
      });
      fetchTickets();
    } catch (err) {
      console.log('Error updating ticket status:', err);
    }
  };

  const handleTogglePriority = async (ticketId: string, currentPriority: boolean) => {
    if (!branchId) return;
    try {
      await api.put(`/kds/tickets/${ticketId}/priority?branchId=${branchId}`, {
        isPriority: !currentPriority,
      });
      fetchTickets();
    } catch (err) {
      console.log('Error toggling priority:', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (selectedTab === 'NEW') return t.status === 'NEW';
    if (selectedTab === 'PREPARING') return t.status === 'PREPARING' || t.status === 'ACCEPTED';
    if (selectedTab === 'READY') return t.status === 'READY';
    return t.status !== 'COMPLETED';
  });

  const getStatusDotColor = () => {
    if (networkState === 'ONLINE') return theme.colors.success;
    if (networkState === 'CONNECTING') return theme.colors.warning;
    return theme.colors.danger;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* KDS Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Kitchen KDS Queue</Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusDotColor() }]} />
            <Text style={styles.statusLabel}>{networkState}</Text>
          </View>
          <Text style={styles.chefName}>Chef Terminal • {user?.name || 'Kitchen Staff'}</Text>
        </View>

        <TouchableOpacity style={styles.logoutChip} onPress={logout}>
          <Text style={styles.logoutChipText}>Sign Out ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Filter Bar */}
      <View style={styles.tabBar}>
        {KITCHEN_TABS.map((tab) => {
          const isActive = selectedTab === tab;
          const count =
            tab === 'ALL'
              ? tickets.filter((t) => t.status !== 'COMPLETED').length
              : tickets.filter((t) =>
                  tab === 'PREPARING'
                    ? t.status === 'PREPARING' || t.status === 'ACCEPTED'
                    : t.status === tab,
                ).length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ticket List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTickets();
            }}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <KitchenTicketCard
            ticket={item}
            onUpdateStatus={handleUpdateStatus}
            onTogglePriority={handleTogglePriority}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍳</Text>
            <Text style={styles.emptyTitle}>No tickets in {selectedTab} queue</Text>
            <Text style={styles.emptySub}>New incoming orders from waiters will sound and display here in real-time.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  chefName: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  logoutChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  logoutChipText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: 6,
    marginVertical: theme.spacing.md,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  tabChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 30,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: theme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
