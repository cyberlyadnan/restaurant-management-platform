import { useNavigation } from '@react-navigation/native';
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
import { MobileTable, TableCard } from '../components/TableCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { theme } from '../theme';

interface Floor {
  id: string;
  name: string;
  tables: MobileTable[];
}

export function TablesScreen() {
  const navigation = useNavigation<any>();
  const { branchId } = useAuth();
  const { setTable, setOrderType } = useCart();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    if (!branchId) return;
    try {
      const data = await api.get<Floor[]>(`/floors?branchId=${branchId}`);
      setFloors(data);
    } catch (err) {
      console.log('Error fetching tables:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const timer = setInterval(fetchTables, 15000);
    return () => clearInterval(timer);
  }, [branchId]);

  const allTables = floors.flatMap((f) => f.tables);
  const availableCount = allTables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = allTables.filter((t) => t.status === 'OCCUPIED').length;

  const filteredTables = allTables.filter((t) => {
    if (selectedStatus === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (selectedStatus === 'OCCUPIED') return t.status === 'OCCUPIED';
    return true;
  });

  const handleStartOrder = (table: MobileTable) => {
    setOrderType('DINE_IN');
    setTable(table.id, table.name ?? `Table ${table.number}`);
    navigation.navigate('POS');
  };

  const handleBillTable = async (table: MobileTable) => {
    try {
      const orders = await api.get<any[]>(`/orders?branchId=${branchId}&tableId=${table.id}`);
      if (orders && orders.length > 0) {
        navigation.navigate('Checkout', { order: orders[0] });
      } else {
        handleStartOrder(table);
      }
    } catch {
      handleStartOrder(table);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Filter Bar */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('ALL')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'ALL' && styles.filterChipTextActive,
            ]}
          >
            All Tables ({allTables.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'AVAILABLE' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('AVAILABLE')}
        >
          <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'AVAILABLE' && styles.filterChipTextActive,
            ]}
          >
            Available ({availableCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'OCCUPIED' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('OCCUPIED')}
        >
          <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === 'OCCUPIED' && styles.filterChipTextActive,
            ]}
          >
            Occupied ({occupiedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTables();
              }}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TableCard
              table={item}
              onStartOrder={() => handleStartOrder(item)}
              onAddRound={() => handleStartOrder(item)}
              onBillTable={() => handleBillTable(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tables found in this category</Text>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 14,
  },
});
