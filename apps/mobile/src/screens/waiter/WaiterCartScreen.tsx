import { ArrowLeft, Flame, Minus, Plus, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import type { CartItem } from './WaiterMenuScreen';

export function WaiterCartScreen({ route, navigation }: any) {
  const { branchId } = useAuth();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { tableId, tableName, cartItems: initialItems = [] } = route.params || {};

  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [orderNotes, setOrderNotes] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  const updateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...item,
        quantity: newQty,
        lineTotal: item.unitPrice * newQty,
      };
      return updated;
    });
  };

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one item to send to kitchen.');
      return;
    }
    if (!branchId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        type: tableId ? 'DINE_IN' : 'TAKEAWAY',
        tableId: tableId || undefined,
        guestCount,
        notes: orderNotes.trim() || undefined,
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          kitchenNote: ci.notes || undefined,
          modifierIds: ci.selectedModifiers.map((m) => m.id),
        })),
      };

      const res = await api.post<any>(`/orders?branchId=${branchId}`, payload);
      setCartItems([]);
      Alert.alert(
        'KOT Sent Successfully! 🍳',
        `Order #${res.orderNumber || 'placed'} has been submitted to the kitchen display.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Orders');
            },
          },
        ],
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to submit order to kitchen.';
      Alert.alert('Order Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={theme.colors.primary} />
            <Text style={[styles.backBtnText, { color: theme.colors.primary }]}>
              Back to Menu
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Review Order & Send KOT
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Table & Guest Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <View>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                  TARGET TABLE
                </Text>
                <Text style={[styles.infoVal, { color: theme.colors.textPrimary }]}>
                  {tableName || 'Takeaway Order'}
                </Text>
              </View>

              <View style={styles.guestControl}>
                <View style={styles.guestLabelRow}>
                  <Users size={12} color={theme.colors.textMuted} />
                  <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>
                    GUESTS
                  </Text>
                </View>
                <View
                  style={[
                    styles.stepperMini,
                    {
                      backgroundColor: theme.colors.surfaceSubtle,
                      borderColor: theme.colors.surfaceBorder,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.stepMiniBtn}
                    onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                  >
                    <Minus size={14} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.guestCountText, { color: theme.colors.textPrimary }]}>
                    {guestCount}
                  </Text>
                  <TouchableOpacity
                    style={styles.stepMiniBtn}
                    onPress={() => setGuestCount(guestCount + 1)}
                  >
                    <Plus size={14} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Cart Items List */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Order Items ({cartItems.length})
          </Text>

          {cartItems.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Your cart is currently empty.
              </Text>
            </View>
          ) : (
            cartItems.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                style={[
                  styles.cartItemCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: theme.colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  {item.selectedModifiers.length > 0 && (
                    <Text style={[styles.modifierText, { color: theme.colors.primary }]}>
                      + {item.selectedModifiers.map((m) => m.name).join(', ')}
                    </Text>
                  )}
                  {item.notes ? (
                    <Text style={[styles.notesText, { color: theme.colors.textMuted }]}>
                      Note: &quot;{item.notes}&quot;
                    </Text>
                  ) : null}
                  <Text style={[styles.itemUnitPrice, { color: theme.colors.textMuted }]}>
                    ₹{item.unitPrice} each
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <View
                    style={[
                      styles.stepper,
                      {
                        backgroundColor: theme.colors.surfaceSubtle,
                        borderColor: theme.colors.surfaceBorder,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(index, -1)}
                    >
                      <Minus size={14} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: theme.colors.textPrimary }]}>
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(index, 1)}
                    >
                      <Plus size={14} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.lineTotalText, { color: theme.colors.textPrimary }]}>
                    ₹{item.lineTotal}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* General Order Notes */}
          <View
            style={[
              styles.notesCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[styles.notesCardLabel, { color: theme.colors.textMuted }]}>
              Kitchen Instructions / General Notes
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.surfaceBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="e.g. Rush order, served all together..."
              placeholderTextColor={theme.colors.textMuted}
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
            />
          </View>

          {/* Summary Card */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                Subtotal
              </Text>
              <Text style={[styles.summaryVal, { color: theme.colors.textPrimary }]}>
                ₹{subtotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>
                Estimated Taxes / Charges
              </Text>
              <Text style={[styles.summaryVal, { color: theme.colors.textMuted }]}>
                Calculated at Billing
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                styles.grandTotalRow,
                { borderColor: theme.colors.surfaceBorder },
              ]}
            >
              <Text style={[styles.grandTotalLabel, { color: theme.colors.textPrimary }]}>
                Estimated Total
              </Text>
              <Text style={[styles.grandTotalVal, { color: theme.colors.primary }]}>
                ₹{subtotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Button
            variant="secondary"
            size="lg"
            loading={isSubmitting}
            disabled={cartItems.length === 0 || isSubmitting}
            onPress={handleSendToKitchen}
            fullWidth
            icon={<Flame size={18} color="#ffffff" />}
          >
            SEND TO KITCHEN
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  guestControl: {
    alignItems: 'flex-end',
  },
  guestLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  stepMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  guestCountText: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  cartItemCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  modifierText: {
    fontSize: 11,
    marginTop: 2,
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemUnitPrice: {
    fontSize: 11,
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  lineTotalText: {
    fontSize: 14,
    fontWeight: '800',
  },
  notesCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 16,
  },
  notesCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    padding: 12,
    minHeight: 50,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 12,
  },
});
