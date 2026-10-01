import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

interface OrderItem {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: string;
  status: string;
  totalAmount: number;
  items: {
    id: string;
    quantity: number;
    menuItem: { name: string };
    notes?: string;
  }[];
  createdAt: string;
}

const ORDER_TABS = ['ACTIVE', 'READY', 'COMPLETED'] as const;

export function WaiterOrdersScreen() {
  const { branchId } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<(typeof ORDER_TABS)[number]>('ACTIVE');

  const fetchOrders = async () => {
    if (!branchId) return;
    try {
      const res = await api.get<any[]>(`/orders?branchId=${branchId}`);
      const mapped: OrderItem[] = (res || []).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.table?.number,
        orderType: o.orderType,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        items: o.items || [],
        createdAt: o.createdAt,
      }));
      setOrders(mapped);
    } catch (err) {
      console.log('Failed to fetch waiter orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (branchId) {
      const handleUpdate = () => fetchOrders();
      socketService.on('order.updated', handleUpdate);
      socketService.on('kot.updated', handleUpdate);
      return () => {
        socketService.off('order.updated', handleUpdate);
        socketService.off('kot.updated', handleUpdate);
      };
    }
  }, [branchId]);

  const handleMarkDelivered = async (orderId: string) => {
    if (!branchId) return;
    try {
      await api.put(`/orders/${orderId}/status?branchId=${branchId}`, {
        status: 'DELIVERED',
      });
      Alert.alert('Success', 'Order marked as delivered to guest table!');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order status');
    }
  };

  const handleRequestBill = async (orderId: string, tableNum?: string) => {
    if (!branchId) return;
    try {
      await api.post(`/notifications?branchId=${branchId}`, {
        type: 'BILL_REQUESTED',
        title: `Bill Requested — Table ${tableNum || ''}`,
        message: `Waiter requested printed bill for Order #${orderId}`,
      });
      Alert.alert('Bill Requested 📄', 'Cashier notification sent for printed invoice.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send bill request notification');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedTab === 'READY') return o.status === 'READY';
    if (selectedTab === 'COMPLETED') return o.status === 'COMPLETED' || o.status === 'DELIVERED';
    return o.status !== 'COMPLETED' && o.status !== 'CANCELLED';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return theme.colors.success;
      case 'PREPARING':
      case 'IN_PROGRESS':
        return theme.colors.warning;
      case 'DELIVERED':
        return theme.colors.info;
      default:
        return theme.colors.textMuted;
    }
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
        <Text style={styles.headerTitle}>Active Waiter Orders</Text>
        <Text style={styles.headerSubtitle}>Real-time status updates from kitchen</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {ORDER_TABS.map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => {
          const isReady = item.status === 'READY';
          const isDelivered = item.status === 'DELIVERED';
          return (
            <View style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View style={styles.orderTitleGroup}>
                  <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  {item.tableNumber ? (
                    <View style={styles.tableBadge}>
                      <Text style={styles.tableBadgeText}>Table {item.tableNumber}</Text>
                    </View>
                  ) : (
                    <View style={styles.takeawayBadge}>
                      <Text style={styles.takeawayText}>Takeaway</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Items preview */}
              <View style={styles.itemsList}>
                {item.items.map((it) => (
                  <Text key={it.id} style={styles.itemLine}>
                    • {it.quantity}× {it.menuItem?.name || 'Item'}
                  </Text>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.totalPrice}>₹{item.totalAmount.toLocaleString()}</Text>

                <View style={styles.actionsGroup}>
                  {isReady && (
                    <TouchableOpacity
                      style={styles.deliverBtn}
                      onPress={() => handleMarkDelivered(item.id)}
                    >
                      <Text style={styles.deliverBtnText}>✓ Mark Delivered</Text>
                    </TouchableOpacity>
                  )}

                  {!isDelivered && (
                    <TouchableOpacity
                      style={styles.billBtn}
                      onPress={() => handleRequestBill(item.id, item.tableNumber)}
                    >
                      <Text style={styles.billBtnText}>📄 Request Bill</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders in {selectedTab}</Text>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    marginBottom: theme.spacing.md,
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
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  orderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  tableBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  tableBadgeText: {
    color: theme.colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  takeawayBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  takeawayText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemsList: {
    marginVertical: theme.spacing.md,
    gap: 4,
  },
  itemLine: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  totalPrice: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  deliverBtn: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  deliverBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  billBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  billBtnText: {
    color: theme.colors.text,
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
