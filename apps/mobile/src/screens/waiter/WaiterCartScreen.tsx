import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import type { CartItem } from './WaiterMenuScreen';

export function WaiterCartScreen({ route, navigation }: any) {
  const { branchId } = useAuth();
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
        tableId: tableId || undefined,
        orderType: tableId ? 'DINE_IN' : 'TAKEAWAY',
        guestCount,
        notes: orderNotes.trim(),
        items: cartItems.map((ci) => ({
          menuItemId: ci.menuItemId,
          quantity: ci.quantity,
          notes: ci.notes || undefined,
          modifiers: ci.selectedModifiers.map((m) => m.id),
        })),
      };

      const res = await api.post<any>(`/orders?branchId=${branchId}`, payload);
      Alert.alert(
        'KOT Sent Successfully! 🍳',
        `Order #${res.orderNumber || 'placed'} has been sent to kitchen tickets.`,
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
      const msg = err.response?.data?.message || err.message || 'Failed to submit order to kitchen.';
      Alert.alert('Order Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back to Menu</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order & Send KOT</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Table & Guests Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>TARGET TABLE</Text>
              <Text style={styles.infoVal}>{tableName || 'Takeaway Order'}</Text>
            </View>

            <View style={styles.guestControl}>
              <Text style={styles.infoLabel}>GUESTS</Text>
              <View style={styles.stepperMini}>
                <TouchableOpacity style={styles.stepMiniBtn} onPress={() => setGuestCount(Math.max(1, guestCount - 1))}>
                  <Text style={styles.stepMiniText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.guestCountText}>{guestCount}</Text>
                <TouchableOpacity style={styles.stepMiniBtn} onPress={() => setGuestCount(guestCount + 1)}>
                  <Text style={styles.stepMiniText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Cart Item List */}
        <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Your cart is currently empty.</Text>
          </View>
        ) : (
          cartItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.cartItemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.selectedModifiers.length > 0 && (
                  <Text style={styles.modifierText}>
                    + {item.selectedModifiers.map((m) => m.name).join(', ')}
                  </Text>
                )}
                {item.notes ? <Text style={styles.notesText}>Note: &quot;{item.notes}&quot;</Text> : null}
                <Text style={styles.itemUnitPrice}>₹{item.unitPrice} each</Text>
              </View>

              <View style={styles.itemActions}>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(index, -1)}>
                    <Text style={styles.stepText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => updateQuantity(index, 1)}>
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.lineTotalText}>₹{item.lineTotal}</Text>
              </View>
            </View>
          ))
        )}

        {/* General Order Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesCardLabel}>Kitchen Instructions / General Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Rush order, served all together..."
            placeholderTextColor={theme.colors.textDim}
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
          />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Taxes / Charges</Text>
            <Text style={styles.summaryVal}>Calculated at Billing</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Estimated Total</Text>
            <Text style={styles.grandTotalVal}>₹{subtotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.sendBtn, (cartItems.length === 0 || isSubmitting) && styles.btnDisabled]}
          onPress={handleSendToKitchen}
          disabled={cartItems.length === 0 || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.sendBtnText}>🔥 SEND TO KITCHEN</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  backBtn: {
    marginBottom: 6,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '800',
  },
  infoVal: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  guestControl: {
    alignItems: 'flex-end',
  },
  stepperMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginTop: 4,
  },
  stepMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepMiniText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  guestCountText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
  },
  cartItemCard: {
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
  itemName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modifierText: {
    color: theme.colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
  notesText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemUnitPrice: {
    color: theme.colors.textDim,
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
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  quantityText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  lineTotalText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  notesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  notesCardLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    color: theme.colors.text,
    fontSize: 13,
    padding: theme.spacing.md,
    minHeight: 50,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  summaryVal: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    marginTop: 8,
    paddingTop: 8,
  },
  grandTotalLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  grandTotalVal: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
  },
  sendBtn: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
