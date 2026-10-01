import { ChefHat, LogOut, UtensilsCrossed, Wifi, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { KitchenTicketCard, KotTicketItem } from '../../components/KitchenTicketCard';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socket';

const KITCHEN_TABS = ['ALL', 'NEW', 'PREPARING', 'READY'] as const;

export function KitchenHomeScreen({ navigation }: any) {
  const { branchId, logout, user } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

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
      await api.patch(`/kds/tickets/${ticketId}/status?branchId=${branchId}`, {
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
      await api.patch(`/kds/tickets/${ticketId}/priority?branchId=${branchId}`, {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* KDS Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View>
          <View style={styles.titleRow}>
            <ChefHat size={22} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Kitchen KDS Queue
            </Text>
            <View style={[styles.statusDot, { backgroundColor: getStatusDotColor() }]} />
          </View>
          <Text style={[styles.chefName, { color: theme.colors.textMuted }]}>
            Chef Terminal • {user?.name || 'Kitchen Staff'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutChip,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={14} color={theme.colors.danger} />
          <Text style={[styles.logoutChipText, { color: theme.colors.danger }]}>
            Sign Out
          </Text>
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
              style={[
                styles.tabChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.surfaceBorder,
                },
              ]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? '#ffffff' : theme.colors.textMuted },
                ]}
              >
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ticket List */}
      {loading && !refreshing ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonLoader height={140} borderRadius={14} />
          <SkeletonLoader height={140} borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
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
              <UtensilsCrossed size={48} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                No tickets in {selectedTab} queue
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                New incoming orders from waiters will sound and display here in real-time.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chefName: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginVertical: 12,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
});
