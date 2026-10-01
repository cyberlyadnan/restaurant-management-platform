import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { theme } from '../theme';

export interface ModifierChoice {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required?: boolean;
  minChoices?: number;
  maxChoices?: number;
  options: ModifierChoice[];
}

export interface MenuItemData {
  id: string;
  name: string;
  description?: string;
  price: number;
  isVeg?: boolean;
  modifierGroups?: ModifierGroup[];
}

interface ItemModifierModalProps {
  visible: boolean;
  item: MenuItemData | null;
  onClose: () => void;
  onAddToCart: (item: MenuItemData, quantity: number, selectedModifiers: ModifierChoice[], notes: string) => void;
}

export function ItemModifierModal({ visible, item, onClose, onAddToCart }: ItemModifierModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<ModifierChoice[]>([]);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSelectedModifiers([]);
      setNotes('');
    }
  }, [visible]);

  if (!item) return null;

  const toggleModifier = (group: ModifierGroup, choice: ModifierChoice) => {
    const isSingleChoice = group.maxChoices === 1 || group.options.length <= 3;
    if (isSingleChoice) {
      const groupOptionIds = group.options.map((o) => o.id);
      const filtered = selectedModifiers.filter((m) => !groupOptionIds.includes(m.id));
      setSelectedModifiers([...filtered, choice]);
    } else {
      const exists = selectedModifiers.some((m) => m.id === choice.id);
      if (exists) {
        setSelectedModifiers(selectedModifiers.filter((m) => m.id !== choice.id));
      } else {
        setSelectedModifiers([...selectedModifiers, choice]);
      }
    }
  };

  const modifierExtraTotal = selectedModifiers.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const unitTotal = item.price + modifierExtraTotal;
  const grandTotal = unitTotal * quantity;

  const handleAdd = () => {
    onAddToCart(item, quantity, selectedModifiers, notes.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheetContainer}>
        <View style={styles.dragHandle} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <View style={[styles.dietBadge, { borderColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]}>
                  <View style={[styles.dietDot, { backgroundColor: item.isVeg ? theme.colors.veg : theme.colors.nonVeg }]} />
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
            </View>
            <Text style={styles.basePrice}>₹{item.price}</Text>
          </View>

          {/* Modifier Groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 ? (
            item.modifierGroups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.name}</Text>
                  {group.required ? <Text style={styles.requiredTag}>REQUIRED</Text> : <Text style={styles.optionalTag}>OPTIONAL</Text>}
                </View>

                {group.options.map((choice) => {
                  const isSelected = selectedModifiers.some((m) => m.id === choice.id);
                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={[styles.choiceRow, isSelected && styles.choiceRowSelected]}
                      onPress={() => toggleModifier(group, choice)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.radioBox}>
                        <View style={[styles.radioDot, isSelected && styles.radioDotActive]} />
                      </View>
                      <Text style={[styles.choiceName, isSelected && styles.choiceNameSelected]}>{choice.name}</Text>
                      {choice.price > 0 && <Text style={styles.choicePrice}>+₹{choice.price}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.defaultCustomization}>
              <Text style={styles.groupTitle}>Customization</Text>
              <Text style={styles.itemDesc}>No specific modifier options configured for this item.</Text>
            </View>
          )}

          {/* Special Instructions Input */}
          <View style={styles.notesGroup}>
            <Text style={styles.groupTitle}>Special Instructions / Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Less spicy, no onions, extra crispy..."
              placeholderTextColor={theme.colors.textDim}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Quantity Stepper */}
          <View style={styles.quantityRow}>
            <Text style={styles.groupTitle}>Quantity</Text>
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityVal}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add Item</Text>
            <Text style={styles.addBtnPrice}>₹{grandTotal}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietBadge: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  itemDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  basePrice: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  groupCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  defaultCustomization: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  groupTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  requiredTag: {
    color: theme.colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  optionalTag: {
    color: theme.colors.textDim,
    fontSize: 10,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    marginTop: 4,
  },
  choiceRowSelected: {
    backgroundColor: theme.colors.surface,
  },
  radioBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioDotActive: {
    backgroundColor: theme.colors.primary,
  },
  choiceName: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  choiceNameSelected: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  choicePrice: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  notesGroup: {
    marginBottom: theme.spacing.lg,
  },
  notesInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    color: theme.colors.text,
    fontSize: 13,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: 4,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  quantityVal: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surface,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  addBtnPrice: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
