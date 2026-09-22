import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';
import { DietaryBadge } from './DietaryBadge';

interface DishCardProps {
  id: string;
  name: string;
  price: number | string;
  isVeg: boolean;
  categoryName?: string;
  isCombo?: boolean;
  hasModifiers?: boolean;
  quantity?: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function DishCard({
  name,
  price,
  isVeg,
  categoryName,
  isCombo,
  hasModifiers,
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
}: DishCardProps) {
  const formattedPrice = `₹${Number(price).toFixed(2)}`;

  return (
    <View
      style={[
        styles.card,
        quantity > 0 && styles.cardActive,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <DietaryBadge isVeg={isVeg} size="sm" />
          {categoryName && (
            <Text style={styles.categoryText} numberOfLines={1}>
              {categoryName}
            </Text>
          )}
        </View>

        {isCombo && (
          <View style={styles.comboBadge}>
            <Text style={styles.comboText}>COMBO</Text>
          </View>
        )}
      </View>

      <Text style={styles.dishName} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.priceText}>{formattedPrice}</Text>
          {hasModifiers && (
            <Text style={styles.customizableText}>Customisable</Text>
          )}
        </View>

        {/* Zomato-style ADD Button or In-Place Stepper */}
        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAdd}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+ ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={onDecrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepperSign}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperQty}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={onIncrement}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepperSign}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginBottom: theme.spacing.sm,
  },
  cardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#064e3b15',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  comboBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comboText: {
    color: '#b45309',
    fontSize: 9,
    fontWeight: '800',
  },
  dishName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1f293780',
    paddingTop: theme.spacing.sm,
  },
  priceText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  customizableText: {
    color: theme.colors.textDim,
    fontSize: 9,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#064e3b30',
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  stepperQty: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
});
