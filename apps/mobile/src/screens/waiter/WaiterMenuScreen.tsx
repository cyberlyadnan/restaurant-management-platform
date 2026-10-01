import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { ItemModifierModal, MenuItemData, ModifierChoice } from '../../components/ItemModifierModal';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

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
  const initialTableId = route.params?.tableId || null;
  const initialTableName = route.params?.tableName || null;

  const [tableId, setTableId] = useState<string | null>(initialTableId);
  const [tableName, setTableName] = useState<string | null>(initialTableName);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Item customization modal
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
      // Direct fast add
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Selector Header */}
      <View style={styles.tableHeader}>
        <View>
          <Text style={styles.tableHeaderLabel}>ASSIGNED TABLE</Text>
          <Text style={styles.tableHeaderVal}>{tableName || 'Select Table'}</Text>
        </View>

        <TouchableOpacity
          style={styles.changeTableBtn}
          onPress={() => navigation.navigate('Tables')}
        >
          <Text style={styles.changeTableBtnText}>Change ➔</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items (e.g. Tikka, Naan, Drinks)..."
          placeholderTextColor={theme.colors.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.categoryBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === 'ALL' && styles.catChipActive]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text style={[styles.catText, selectedCategory === 'ALL' && styles.catTextActive]}>All Items</Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu Item Cards */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => handleOpenItem(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.itemHeader}>
                <View style={[styles.dietBadge, { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                  <View style={[styles.dietDot, { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>

              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleOpenItem(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ ADD</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Item Customization Bottom Sheet */}
      <ItemModifierModal
        visible={modalVisible}
        item={activeItem}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Floating Cart CTA Footer */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity
            style={styles.cartBarBtn}
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
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartBarTotal}>₹{cartSubtotal.toLocaleString()}</Text>
            </View>

            <Text style={styles.cartBarCta}>View Cart & Send KOT ➔</Text>
          </TouchableOpacity>
        </View>
      )}
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
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  tableHeaderLabel: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '800',
  },
  tableHeaderVal: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  changeTableBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
  },
  changeTableBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    color: theme.colors.text,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryBarContainer: {
    marginVertical: theme.spacing.md,
  },
  categoryBar: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  catChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  catChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  catTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
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
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  addBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    marginLeft: theme.spacing.md,
  },
  addBtnText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
  },
  cartBarBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadge: {
    backgroundColor: '#ffffff',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  cartBarTotal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cartBarCta: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
