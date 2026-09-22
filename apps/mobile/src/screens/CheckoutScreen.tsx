import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'CARD', label: 'Card', icon: '💳' },
  { id: 'UPI', label: 'UPI / QR', icon: '📱' },
  { id: 'WALLET', label: 'Wallet', icon: '👛' },
];

const DISCOUNT_PRESETS = [0, 5, 10, 15, 20];
const TIP_PRESETS = [0, 50, 100, 200];

export function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { branchId } = useAuth();
  const order = route.params?.order;

  const [method, setMethod] = useState<string>('CASH');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No active order found</Text>
      </SafeAreaView>
    );
  }

  const rawSubtotal = Number(order.subtotal);
  const discountVal = (rawSubtotal * discountPercent) / 100;
  const totalDue = Math.max(0, rawSubtotal - discountVal + tipAmount);
  const perPerson = totalDue / splitCount;

  const handleCompletePayment = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/orders/${order.id}/checkout?branchId=${branchId}`, {
        discountPercent,
        tipAmount,
        payments: [{ method, amount: totalDue }],
      });
      setIsCompleted(true);
      toastAlert('Payment Recorded!', `Order #${order.orderNumber} successfully paid.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Payment processing failed';
      Alert.alert('Payment Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toastAlert = (title: string, msg: string) => {
    Alert.alert(title, msg, [
      { text: 'Back to Tables', onPress: () => navigation.navigate('Tables') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Order Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount Due</Text>
          <Text style={styles.amountValue}>₹{totalDue.toFixed(2)}</Text>
          <Text style={styles.taxSubtext}>inclusive of applicable GST / taxes</Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodsGrid}>
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = method === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  style={[styles.methodTile, isSelected && styles.methodTileActive]}
                  onPress={() => setMethod(pm.id)}
                >
                  <Text style={styles.methodIcon}>{pm.icon}</Text>
                  <Text style={[styles.methodLabel, isSelected && styles.methodLabelActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Discount */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Discount</Text>
            {discountVal > 0 && (
              <Text style={styles.discountBadge}>− ₹{discountVal.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.chipsRow}>
            {DISCOUNT_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, discountPercent === p && styles.chipActive]}
                onPress={() => setDiscountPercent(p)}
              >
                <Text style={[styles.chipText, discountPercent === p && styles.chipTextActive]}>
                  {p}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tip */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Tip / Gratuity</Text>
            {tipAmount > 0 && (
              <Text style={styles.tipBadge}>+ ₹{tipAmount.toFixed(2)}</Text>
            )}
          </View>
          <View style={styles.chipsRow}>
            {TIP_PRESETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, tipAmount === t && styles.chipActive]}
                onPress={() => setTipAmount(t)}
              >
                <Text style={[styles.chipText, tipAmount === t && styles.chipTextActive]}>
                  {t === 0 ? 'None' : `+₹${t}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Bill */}
        <View style={styles.sectionCard}>
          <View style={styles.splitRow}>
            <View>
              <Text style={styles.sectionTitle}>Split Bill</Text>
              <Text style={styles.splitSubtext}>
                ₹{perPerson.toFixed(2)} per person
              </Text>
            </View>
            <View style={styles.splitStepper}>
              <TouchableOpacity
                style={styles.splitBtn}
                onPress={() => setSplitCount((c) => Math.max(1, c - 1))}
              >
                <Text style={styles.splitSign}>−</Text>
              </TouchableOpacity>
              <Text style={styles.splitCount}>{splitCount}p</Text>
              <TouchableOpacity
                style={styles.splitBtn}
                onPress={() => setSplitCount((c) => c + 1)}
              >
                <Text style={styles.splitSign}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pinned Bottom Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
          disabled={isSubmitting}
          onPress={handleCompletePayment}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.payButtonText}>
              Complete Payment • ₹{totalDue.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  backBtn: {
    padding: 6,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 40,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  amountCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  amountLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  taxSubtext: {
    color: theme.colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  discountBadge: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  tipBadge: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  methodTile: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceBorder,
  },
  methodTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#064e3b25',
  },
  methodIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  methodLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  methodLabelActive: {
    color: theme.colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitSubtext: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  splitStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  splitBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitSign: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  splitCount: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
