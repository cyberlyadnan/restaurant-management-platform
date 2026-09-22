import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { theme } from '../theme';
import { DietaryBadge } from './DietaryBadge';

interface FullCartModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const PRESET_NOTES = ['🌶️ Extra Spicy', '🧂 Less Salt', '🚫 No Onion/Garlic', '📦 Pack Separately'];

export function FullCartModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: FullCartModalProps) {
  const {
    lines,
    orderType,
    tableName,
    kitchenNote,
    setKitchenNote,
    subtotal,
    totalCount,
    increment,
    decrement,
    removeLine,
    clearCart,
  } = useCart();

  const formattedSubtotal = `₹${subtotal.toFixed(2)}`;

  const addPresetNote = (note: string) => {
    if (kitchenNote.includes(note)) return;
    setKitchenNote(kitchenNote ? `${kitchenNote}, ${note}` : note);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Review Cart & Order</Text>
            <Text style={styles.subtitle}>
              {orderType === 'DINE_IN'
                ? `Dine-In • ${tableName ?? 'Table Unassigned'}`
                : 'Takeaway Order'}{' '}
              • {totalCount} items
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Itemized List */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {lines.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {lines.length === 0 ? (
              <Text style={styles.emptyText}>Your cart is currently empty</Text>
            ) : (
              lines.map((line) => (
                <View key={line.key} style={styles.lineItem}>
                  <View style={styles.lineLeft}>
                    <DietaryBadge isVeg={line.isVeg} size="sm" />
                    <View style={styles.lineInfo}>
                      <Text style={styles.lineName} numberOfLines={1}>
                        {line.name}
                      </Text>
                      {line.modifierLabel ? (
                        <Text style={styles.lineModifier}>
                          {line.modifierLabel}
                        </Text>
                      ) : null}
                      <Text style={styles.linePrice}>
                        ₹{(line.unitPrice * line.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Stepper */}
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => decrement(line.key)}
                    >
                      <Text style={styles.stepperSign}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperCount}>{line.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => increment(line.key)}
                    >
                      <Text style={styles.stepperSign}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeLine(line.key)}
                    style={styles.trashBtn}
                  >
                    <Text style={styles.trashText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Kitchen Instructions */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Cooking Instructions</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. Less spicy, gravy separately..."
              placeholderTextColor={theme.colors.textDim}
              value={kitchenNote}
              onChangeText={setKitchenNote}
            />
            <View style={styles.presetRow}>
              {PRESET_NOTES.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => addPresetNote(preset)}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bill Summary */}
          <View style={styles.cardSection}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Subtotal ({totalCount})</Text>
              <Text style={styles.billValue}>{formattedSubtotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>GST / Taxes</Text>
              <Text style={styles.billValueMuted}>Included</Text>
            </View>
            <View style={[styles.billRow, styles.billTotalRow]}>
              <Text style={styles.billTotalLabel}>Grand Total</Text>
              <Text style={styles.billTotalValue}>{formattedSubtotal}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Pinned Bottom Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (lines.length === 0 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            disabled={lines.length === 0 || isSubmitting}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting
                ? 'Firing to Kitchen…'
                : `Confirm & Send to Kitchen (KOT) • ${formattedSubtotal}`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cardSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  clearText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#37415130',
  },
  lineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  lineModifier: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  linePrice: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  stepperCount: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  trashBtn: {
    marginLeft: 10,
    padding: 4,
  },
  trashText: {
    fontSize: 14,
  },
  noteInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    color: theme.colors.text,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: theme.spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetChipText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  billValue: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  billValueMuted: {
    color: theme.colors.textDim,
    fontSize: 12,
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  billTotalLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  billTotalValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
