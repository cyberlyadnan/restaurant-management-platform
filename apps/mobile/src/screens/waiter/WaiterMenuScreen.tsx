import { ChevronRight, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { SearchBar } from '../../components/common/SearchBar';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { ItemModifierModal, MenuItemData, ModifierChoice } from '../../components/ItemModifierModal';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  selectedModifiers: ModifierChoice[];
  notes?: string;
  lineTotal: number;
}

export function WaiterMenuScreen({ route, navigation }: any) {
  const { branchId } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const initialTableId = route.params?.tableId || null;
  const initialTableName = route.params?.tableName || null;

  const [tableId] = useState<string | null>(initialTableId);
  const [tableName] = useState<string | null>(initialTableName);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Customization modal
  const [activeItem, setActiveItem] = useState<MenuItemData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    fetchMenu();
  }, [branchId]);

  const fetchMenu = async () => {
    if (!branchId) return;
    try {
      const catRes = await api.get<any[]>(`/menu/categories?branchId=${branchId}`);
      setCategories(catRes || []);

      const itemsRes = await api.get<any[]>(`/menu/items?branchId=${branchId}`);
      const mapped: MenuItemData[] = (itemsRes || []).map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        isVeg: i.isVeg ?? true,
        modifierGroups: i.modifierGroups?.map((g: any) => ({
          id: g.id,
          name: g.name,
          required: g.required,
          options: g.options?.map((o: any) => ({
            id: o.id,
            name: o.name,
            price: Number(o.price || 0),
          })),
        })),
      }));
      setMenuItems(mapped);
    } catch (err) {
      console.log('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = (item: MenuItemData) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setActiveItem(item);
      setModalVisible(true);
    } else {
      handleAddToCart(item, 1, [], '');
    }
  };

  const handleAddToCart = (
    item: MenuItemData,
    quantity: number,
    modifiers: ModifierChoice[],
    notes: string,
  ) => {
    const extraPrice = modifiers.reduce((sum, m) => sum + (m.price || 0), 0);
    const unitPrice = item.price + extraPrice;
    const lineTotal = unitPrice * quantity;

    const cartId = `${item.id}-${modifiers.map((m) => m.id).join('-')}-${notes}`;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((ci) => ci.id === cartId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: updated[existingIdx].unitPrice * newQty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: cartId,
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity,
          selectedModifiers: modifiers,
          notes,
          lineTotal,
        },
      ];
    });
  };

  const cartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, ci) => acc + ci.lineTotal, 0);

  const filteredItems = menuItems.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory === 'ALL') return matchesSearch;
    return matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Table Selector Header */}
      <View
        style={[
          styles.tableHeader,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View>
          <Text style={[styles.tableHeaderLabel, { color: theme.colors.textMuted }]}>
            TARGET TABLE
          </Text>
          <Text style={[styles.tableHeaderVal, { color: theme.colors.textPrimary }]}>
            {tableName || 'Select Table'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.changeTableBtn,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
          onPress={() => navigation.navigate('Tables')}
          activeOpacity={0.7}
        >
          <Text style={[styles.changeTableBtnText, { color: theme.colors.primary }]}>
            Change Table
          </Text>
          <ChevronRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items (e.g. Tikka, Naan, Drinks)..."
        />
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.categoryBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
        >
          <TouchableOpacity
            style={[
              styles.catChip,
              {
                backgroundColor:
                  selectedCategory === 'ALL' ? theme.colors.primary : theme.colors.surface,
                borderColor:
                  selectedCategory === 'ALL'
                    ? theme.colors.primary
                    : theme.colors.surfaceBorder,
              },
            ]}
            onPress={() => setSelectedCategory('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.catText,
                { color: selectedCategory === 'ALL' ? '#ffffff' : theme.colors.textMuted },
              ]}
            >
              All Items
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.catText,
                    { color: isActive ? '#ffffff' : theme.colors.textMuted },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu Items List */}
      {loading ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <SkeletonLoader height={70} borderRadius={14} />
          <SkeletonLoader height={70} borderRadius={14} />
          <SkeletonLoader height={70} borderRadius={14} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
              onPress={() => handleOpenItem(item)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.itemHeader}>
                  <View
                    style={[
                      styles.dietBadge,
                      { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg },
                    ]}
                  >
                    <View
                      style={[
                        styles.dietDot,
                        { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg },
                      ]}
                    />
                  </View>
                  <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                    {item.name}
                  </Text>
                </View>

                {item.description ? (
                  <Text style={[styles.itemDesc, { color: theme.colors.textMuted }]}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                  ₹{item.price}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: theme.colors.primaryLight }]}
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.8}
              >
                <Plus size={14} color={theme.colors.primaryDark} />
                <Text style={[styles.addBtnText, { color: theme.colors.primaryDark }]}>
                  ADD
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UtensilsCrossed size={36} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textMuted }]}>
                No menu items found
              </Text>
            </View>
          }
        />
      )}

      {/* Item Customization Modal */}
      <ItemModifierModal
        visible={modalVisible}
        item={activeItem}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart CTA Footer */}
      {cartCount > 0 && (
        <View
          style={[
            styles.cartBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.cartBarBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() =>
              navigation.navigate('Cart', {
                tableId,
                tableName,
                cartItems,
                setCartItems,
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.cartBadgeGroup}>
              <View style={styles.cartBadge}>
                <ShoppingBag size={14} color={theme.colors.primary} />
              </View>
              <Text style={styles.cartBarTotal}>
                {cartCount} Items • ₹{cartSubtotal.toLocaleString()}
              </Text>
            </View>

            <View style={styles.cartCtaRow}>
              <Text style={styles.cartBarCta}>View Cart & Send KOT</Text>
              <ChevronRight size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  tableHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  tableHeaderVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  changeTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeTableBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  categoryBarContainer: {
    marginVertical: 12,
  },
  categoryBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietBadge: {
    width: 12,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 12,
  },
  cartBarBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBadge: {
    backgroundColor: '#ffffff',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarTotal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cartCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartBarCta: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
  },
});
