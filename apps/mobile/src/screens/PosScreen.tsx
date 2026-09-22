import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { DietaryBadge } from '../components/DietaryBadge';
import { DishCard } from '../components/DishCard';
import { FullCartModal } from '../components/FullCartModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { theme } from '../theme';

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: string;
  isVeg: boolean;
  isCombo: boolean;
  categoryId: string;
  category?: { name: string };
  modifierGroups?: any[];
}

export function PosScreen() {
  const navigation = useNavigation<any>();
  const { branchId } = useAuth();
  const {
    lines,
    orderType,
    tableId,
    tableName,
    kitchenNote,
    subtotal,
    totalCount,
    addItem,
    increment,
    decrement,
    clearCart,
    setOrderType,
  } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'COMBOS'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      if (!branchId) return;
      try {
        const [cats, menuItems] = await Promise.all([
          api.get<Category[]>(`/menu/categories?branchId=${branchId}`),
          api.get<MenuItem[]>(`/menu/items?branchId=${branchId}`),
        ]);
        setCategories(cats);
        setItems(menuItems);
      } catch (err) {
        console.log('Error loading menu:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [branchId]);

  // Map item IDs to cart quantity
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lines) {
      map.set(l.menuItemId, (map.get(l.menuItemId) ?? 0) + l.quantity);
    }
    return map;
  }, [lines]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.categoryId !== selectedCategory) return false;
      if (dietaryFilter === 'VEG' && !item.isVeg) return false;
      if (dietaryFilter === 'NON_VEG' && item.isVeg) return false;
      if (dietaryFilter === 'COMBOS' && !item.isCombo) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.category?.name && item.category.name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, selectedCategory, dietaryFilter, search]);

  const handleSubmitOrder = async () => {
    if (lines.length === 0) return;
    if (orderType === 'DINE_IN' && !tableId) {
      Alert.alert('Table Required', 'Please assign a table before placing a dine-in order', [
        { text: 'Select Table', onPress: () => navigation.navigate('Tables') },
        { text: 'Switch to Takeaway', onPress: () => setOrderType('TAKEAWAY') },
      ]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: orderType,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        notes: kitchenNote || undefined,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          modifierIds: l.modifierIds,
        })),
      };

      const order = await api.post<any>(`/orders?branchId=${branchId}`, payload);
      setCartModalOpen(false);
      clearCart();
      Alert.alert(
        'Order Sent to Kitchen! 🚀',
        `Order #${order.orderNumber} fired to kitchen display.`,
        [
          { text: 'View Tables', onPress: () => navigation.navigate('Tables') },
          { text: 'Take Next Order', style: 'cancel' },
        ],
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not send order to kitchen';
      Alert.alert('Order Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search & Table Context Strip */}
      <View style={styles.topStrip}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes, drinks, combos..."
            placeholderTextColor={theme.colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Table / Order Type Chip */}
        <TouchableOpacity
          style={styles.contextChip}
          onPress={() => navigation.navigate('Tables')}
        >
          <Text style={styles.contextChipText}>
            {orderType === 'DINE_IN'
              ? tableName
                ? `🍽️ ${tableName}`
                : 'Select Table'
              : '📦 Takeaway'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dietary Filter Pills */}
      <View style={styles.dietaryRow}>
        <TouchableOpacity
          style={[styles.dietaryChip, dietaryFilter === 'ALL' && styles.dietaryChipActive]}
          onPress={() => setDietaryFilter('ALL')}
        >
          <Text
            style={[
              styles.dietaryChipText,
              dietaryFilter === 'ALL' && styles.dietaryChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dietaryChip, dietaryFilter === 'VEG' && styles.dietaryChipActive]}
          onPress={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
        >
          <DietaryBadge isVeg={true} size="sm" />
          <Text
            style={[
              styles.dietaryChipText,
              dietaryFilter === 'VEG' && styles.dietaryChipTextActive,
            ]}
          >
            Veg
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dietaryChip, dietaryFilter === 'NON_VEG' && styles.dietaryChipActive]}
          onPress={() => setDietaryFilter(dietaryFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
        >
          <DietaryBadge isVeg={false} size="sm" />
          <Text
            style={[
              styles.dietaryChipText,
              dietaryFilter === 'NON_VEG' && styles.dietaryChipTextActive,
            ]}
          >
            Non-Veg
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dietaryChip, dietaryFilter === 'COMBOS' && styles.dietaryChipActive]}
          onPress={() => setDietaryFilter(dietaryFilter === 'COMBOS' ? 'ALL' : 'COMBOS')}
        >
          <Text
            style={[
              styles.dietaryChipText,
              dietaryFilter === 'COMBOS' && styles.dietaryChipTextActive,
            ]}
          >
            ✨ Combos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Scroll Tabs */}
      {categories.length > 0 && (
        <View style={styles.categoryScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === null && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === null && styles.categoryTabTextActive,
                ]}
              >
                All Menu
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat.id && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === cat.id && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Dish List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.dishList,
            totalCount > 0 && { paddingBottom: 80 },
          ]}
          renderItem={({ item }) => {
            const qty = cartQtyMap.get(item.id) ?? 0;
            const line = lines.find((l) => l.menuItemId === item.id);

            return (
              <DishCard
                id={item.id}
                name={item.name}
                price={item.price}
                isVeg={item.isVeg}
                categoryName={item.category?.name}
                isCombo={item.isCombo}
                hasModifiers={Boolean(item.modifierGroups && item.modifierGroups.length > 0)}
                quantity={qty}
                onAdd={() => addItem(item)}
                onIncrement={() => {
                  if (line) increment(line.key);
                  else addItem(item);
                }}
                onDecrement={() => {
                  if (line) decrement(line.key);
                }}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No dishes found matching filters</Text>
            </View>
          }
        />
      )}

      {/* Zomato-Style Sticky Floating Bottom Cart Bar */}
      {totalCount > 0 && (
        <View style={styles.floatingBarWrapper}>
          <TouchableOpacity
            style={styles.floatingBar}
            onPress={() => setCartModalOpen(true)}
            activeOpacity={0.9}
          >
            <View style={styles.floatingBarLeft}>
              <View style={styles.cartIconBadge}>
                <Text style={styles.cartIconText}>🛒</Text>
              </View>
              <View>
                <Text style={styles.cartCountText}>{totalCount} items added</Text>
                <Text style={styles.cartSubtotalText}>₹{subtotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.floatingBarRight}>
              <Text style={styles.viewCartText}>View Full Cart →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Cart Review Modal */}
      <FullCartModal
        visible={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        onSubmit={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topStrip: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12,
    padding: 0,
  },
  clearSearch: {
    color: theme.colors.textDim,
    fontSize: 12,
    padding: 4,
  },
  contextChip: {
    backgroundColor: '#064e3b30',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 38,
    justifyContent: 'center',
  },
  contextChipText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  dietaryRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: 6,
    backgroundColor: theme.colors.surface,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  dietaryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dietaryChipText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  dietaryChipTextActive: {
    color: '#ffffff',
  },
  categoryScrollContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    marginRight: 6,
  },
  categoryTabActive: {
    backgroundColor: '#ffffff',
  },
  categoryTabText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  dishList: {
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
    fontSize: 13,
  },
  floatingBarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  floatingBar: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIconText: {
    fontSize: 16,
  },
  cartCountText: {
    color: '#d1fae5',
    fontSize: 11,
    fontWeight: '600',
  },
  cartSubtotalText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  floatingBarRight: {
    backgroundColor: '#ffffff25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  viewCartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
