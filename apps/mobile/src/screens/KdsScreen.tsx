import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
  kitchenNote?: string;
}

interface KdsTicket {
  id: string;
  orderNumber: string;
  tableName: string | null;
  type: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
  items: KdsItem[];
  createdAt: string;
}

export function KdsScreen() {
  const { branchId } = useAuth();
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    if (!branchId) return;
    try {
      const data = await api.get<KdsTicket[]>(`/kds/orders?branchId=${branchId}`);
      setTickets(data);
    } catch (err) {
      console.log('Error fetching KDS tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [branchId]);

  const updateStatus = async (ticketId: string, status: KdsTicket['status']) => {
    try {
      await api.put(`/kds/orders/${ticketId}/status?branchId=${branchId}`, { status });
      fetchTickets();
    } catch (err) {
      console.log('Error updating ticket:', err);
    }
  };

  const getStatusBadgeColor = (status: KdsTicket['status']) => {
    switch (status) {
      case 'PENDING':
        return theme.colors.warning;
      case 'PREPARING':
        return theme.colors.info;
      case 'READY':
        return theme.colors.success;
      default:
        return theme.colors.textDim;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Kitchen Display (KDS)</Text>
        <Text style={styles.activeCount}>{tickets.length} Active Tickets</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTickets();
              }}
              tintColor={theme.colors.secondary}
            />
          }
          renderItem={({ item }) => {
            const badgeColor = getStatusBadgeColor(item.status);

            return (
              <View style={[styles.ticketCard, { borderColor: badgeColor + '50' }]}>
                {/* Ticket Header */}
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    <Text style={styles.orderType}>
                      {item.type === 'DINE_IN'
                        ? item.tableName ?? 'Dine-In'
                        : 'Takeaway'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badgeColor + '20', borderColor: badgeColor + '40' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: badgeColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.itemsList}>
                  {item.items.map((i, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyText}>{i.quantity}×</Text>
                      </View>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{i.name}</Text>
                        {i.kitchenNote && (
                          <Text style={styles.itemNote}>Note: {i.kitchenNote}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  {item.status === 'PENDING' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.info }]}
                      onPress={() => updateStatus(item.id, 'PREPARING')}
                    >
                      <Text style={styles.actionBtnText}>Start Cooking 🍳</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'PREPARING' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.success }]}
                      onPress={() => updateStatus(item.id, 'READY')}
                    >
                      <Text style={styles.actionBtnText}>Mark Ready ✓</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'READY' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceSubtle }]}
                      onPress={() => updateStatus(item.id, 'SERVED')}
                    >
                      <Text style={styles.actionBtnText}>Bump / Served</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👨‍🍳</Text>
              <Text style={styles.emptyTitle}>Kitchen all caught up!</Text>
              <Text style={styles.emptySubtitle}>No pending tickets</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  topTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  activeCount: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    marginBottom: theme.spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#37415140',
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  orderNumber: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  orderType: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemsList: {
    gap: 8,
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  itemNote: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  actionsRow: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#37415140',
    paddingTop: theme.spacing.sm,
  },
  actionBtn: {
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: theme.colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
});
