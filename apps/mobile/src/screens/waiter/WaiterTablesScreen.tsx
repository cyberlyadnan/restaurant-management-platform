import type { TableStatusDto } from '@nodedr-restaurant/types';
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
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket';
import { theme } from '../../theme';

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
    if (selectedFilter === 'FOOD READY') return t.status === 'OCCUPIED' && t.activeOrder?.status === 'READY';
    return true;
  });

  const getStatusBadge = (table: TableItem) => {
    if (table.status === 'AVAILABLE') {
      return { label: 'AVAILABLE', bg: theme.colors.surfaceSubtle, color: theme.colors.primary };
    }
    if (table.activeOrder?.status === 'READY') {
      return { label: 'FOOD READY', bg: theme.colors.secondaryLight, color: theme.colors.secondary };
    }
    if (table.status === 'OCCUPIED') {
      return { label: 'OCCUPIED', bg: theme.colors.surfaceSubtle, color: theme.colors.info };
    }
    return { label: table.status, bg: theme.colors.surfaceSubtle, color: theme.colors.textMuted };
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Floor Layout & Tables</Text>
        <Text style={styles.headerSubtitle}>{tables.length} Total Tables Registered</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {STATUS_FILTERS.map((f) => {
          const isActive = selectedFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tables Grid */}
      <FlatList
        data={filteredTables}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
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
        renderItem={({ item }) => {
          const badge = getStatusBadge(item);
          return (
            <TouchableOpacity
              style={styles.card}
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
                <View style={styles.tableNumBadge}>
                  <Text style={styles.tableNumText}>T-{item.number}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.guestText}>👥 Max {item.capacity} Guests</Text>
                {item.floorName ? <Text style={styles.floorText}>{item.floorName}</Text> : null}
              </View>

              <View style={styles.cardFooter}>
                {item.activeOrder ? (
                  <View style={styles.orderSummary}>
                    <Text style={styles.orderPrice}>₹{item.activeOrder.totalAmount.toLocaleString()}</Text>
                    <Text style={styles.itemCount}>{item.activeOrder.itemCount} items</Text>
                  </View>
                ) : (
                  <Text style={styles.availableAction}>Tap to seat / order ➔</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No tables match filter</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  gridContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableNumBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  tableNumText: {
    color: theme.colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardBody: {
    marginVertical: theme.spacing.md,
  },
  guestText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  floorText: {
    color: theme.colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    paddingTop: theme.spacing.sm,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  itemCount: {
    color: theme.colors.textDim,
    fontSize: 11,
  },
  availableAction: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
