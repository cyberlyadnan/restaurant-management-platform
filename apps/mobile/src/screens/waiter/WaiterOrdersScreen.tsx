import { Check, Package, Receipt } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Active Waiter Orders
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
          Real-time status updates from kitchen
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {ORDER_TABS.map((tab) => {
          const isActive = selectedTab === tab;
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
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonLoader height={120} borderRadius={14} />
          <SkeletonLoader height={120} borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30 }]}
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
              <View
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardHeader,
                    { borderColor: theme.colors.surfaceBorder },
                  ]}
                >
                  <View style={styles.orderTitleGroup}>
                    <Text style={[styles.orderNumber, { color: theme.colors.textPrimary }]}>
                      #{item.orderNumber}
                    </Text>
                    {item.tableNumber ? (
                      <View style={[styles.tableBadge, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[styles.tableBadgeText, { color: theme.colors.primaryDark }]}>
                          Table {item.tableNumber}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.takeawayBadge, { backgroundColor: theme.colors.surfaceSubtle }]}>
                        <Text style={[styles.takeawayText, { color: theme.colors.textMuted }]}>
                          Takeaway
                        </Text>
                      </View>
                    )}
                  </View>

                  <StatusBadge status={item.status} size="sm" />
                </View>

                {/* Items preview */}
                <View style={styles.itemsList}>
                  {item.items.map((it) => (
                    <Text
                      key={it.id}
                      style={[styles.itemLine, { color: theme.colors.textSecondary }]}
                    >
                      • {it.quantity}× {it.menuItem?.name || 'Item'}
                    </Text>
                  ))}
                </View>

                <View
                  style={[
                    styles.cardFooter,
                    { borderColor: theme.colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.totalPrice, { color: theme.colors.textPrimary }]}>
                    ₹{item.totalAmount.toLocaleString()}
                  </Text>

                  <View style={styles.actionsGroup}>
                    {isReady && (
                      <TouchableOpacity
                        style={[styles.deliverBtn, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleMarkDelivered(item.id)}
                        activeOpacity={0.8}
                      >
                        <Check size={14} color="#ffffff" />
                        <Text style={styles.deliverBtnText}>Mark Delivered</Text>
                      </TouchableOpacity>
                    )}

                    {!isDelivered && (
                      <TouchableOpacity
                        style={[
                          styles.billBtn,
                          {
                            backgroundColor: theme.colors.surfaceSubtle,
                            borderColor: theme.colors.surfaceBorder,
                          },
                        ]}
                        onPress={() => handleRequestBill(item.id, item.tableNumber)}
                        activeOpacity={0.8}
                      >
                        <Receipt size={14} color={theme.colors.textPrimary} />
                        <Text style={[styles.billBtnText, { color: theme.colors.textPrimary }]}>
                          Request Bill
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={40} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
                No orders in {selectedTab}
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  orderCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  orderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  tableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  takeawayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  takeawayText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemsList: {
    marginVertical: 12,
    gap: 4,
  },
  itemLine: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deliverBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  billBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  billBtnText: {
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
