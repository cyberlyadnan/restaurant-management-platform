import type { TableStatusDto } from '@nodedr-restaurant/types';
import { ChevronRight, Users, Utensils } from 'lucide-react-native';
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
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { socketService } from '../../services/socket';

interface TableItem {
  id: string;
  number: string;
  name?: string;
  capacity: number;
  status: TableStatusDto;
  floorName?: string;
  activeOrder?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    itemCount: number;
    status: string;
  };
}

const STATUS_FILTERS = ['ALL', 'AVAILABLE', 'OCCUPIED', 'FOOD READY'] as const;

export function WaiterTablesScreen({ navigation }: any) {
  const { branchId } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<(typeof STATUS_FILTERS)[number]>('ALL');

  const loadTables = async () => {
    if (!branchId) return;
    try {
      const floors = await api.get<any[]>(`/tables/floors?branchId=${branchId}`);
      const list: TableItem[] = floors.flatMap((f) =>
        f.tables.map((t: any) => ({
          id: t.id,
          number: t.number,
          name: t.name,
          capacity: t.capacity,
          status: t.status,
          floorName: f.name,
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
      setTables(list);
    } catch (err) {
      console.log('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTables();

    if (branchId) {
      const handleUpdate = () => loadTables();
      socketService.on('table.updated', handleUpdate);
      socketService.on('order.updated', handleUpdate);
      return () => {
        socketService.off('table.updated', handleUpdate);
        socketService.off('order.updated', handleUpdate);
      };
    }
  }, [branchId]);

  const filteredTables = tables.filter((t) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (selectedFilter === 'OCCUPIED') return t.status === 'OCCUPIED';
    if (selectedFilter === 'FOOD READY')
      return t.status === 'OCCUPIED' && t.activeOrder?.status === 'READY';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Floor Layout & Tables
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
          {tables.length} Total Tables Registered
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {STATUS_FILTERS.map((f) => {
          const isActive = selectedFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.surfaceBorder,
                },
              ]}
              onPress={() => setSelectedFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#ffffff' : theme.colors.textMuted },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tables Grid */}
      {loading && !refreshing ? (
        <View style={styles.skeletonGrid}>
          <SkeletonLoader height={130} width="48%" borderRadius={14} />
          <SkeletonLoader height={130} width="48%" borderRadius={14} />
          <SkeletonLoader height={130} width="48%" borderRadius={14} />
          <SkeletonLoader height={130} width="48%" borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 30 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTables();
              }}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
              onPress={() =>
                navigation.navigate('Menu', {
                  tableId: item.id,
                  tableName: item.name || `Table ${item.number}`,
                  capacity: item.capacity,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.tableNumBadge, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.tableNumText, { color: theme.colors.primaryDark }]}>
                    T-{item.number}
                  </Text>
                </View>
                <StatusBadge
                  status={
                    item.activeOrder?.status === 'READY'
                      ? 'FOOD READY'
                      : item.status === 'AVAILABLE'
                      ? 'AVAILABLE'
                      : 'OCCUPIED'
                  }
                  size="sm"
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.guestRow}>
                  <Users size={12} color={theme.colors.textMuted} />
                  <Text style={[styles.guestText, { color: theme.colors.textMuted }]}>
                    Max {item.capacity} Guests
                  </Text>
                </View>
                {item.floorName ? (
                  <Text style={[styles.floorText, { color: theme.colors.textMuted }]}>
                    {item.floorName}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.cardFooter, { borderColor: theme.colors.surfaceBorder }]}>
                {item.activeOrder ? (
                  <View style={styles.orderSummary}>
                    <Text style={[styles.orderPrice, { color: theme.colors.textPrimary }]}>
                      ₹{item.activeOrder.totalAmount.toLocaleString()}
                    </Text>
                    <Text style={[styles.itemCount, { color: theme.colors.textMuted }]}>
                      {item.activeOrder.itemCount} items
                    </Text>
                  </View>
                ) : (
                  <View style={styles.availableActionRow}>
                    <Text style={[styles.availableAction, { color: theme.colors.primary }]}>
                      Start Order
                    </Text>
                    <ChevronRight size={12} color={theme.colors.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Utensils size={40} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
                No tables match filter
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridContent: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardBody: {
    marginVertical: 12,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestText: {
    fontSize: 11,
    fontWeight: '600',
  },
  floorText: {
    fontSize: 10,
    marginTop: 2,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemCount: {
    fontSize: 10,
  },
  availableActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availableAction: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
  },
});
