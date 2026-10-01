import { Check, Minus, Plus, X } from 'lucide-react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { Button } from './common/Button';

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
  onAddToCart: (
    item: MenuItemData,
    quantity: number,
    selectedModifiers: ModifierChoice[],
    notes: string,
  ) => void;
}

export function ItemModifierModal({
  visible,
  item,
  onClose,
  onAddToCart,
}: ItemModifierModalProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

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
        <View style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.surfaceBorder,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={[styles.dragHandle, { backgroundColor: theme.colors.surfaceBorder }]} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={[styles.header, { borderColor: theme.colors.surfaceBorder }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
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
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Modifier Groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 ? (
            item.modifierGroups.map((group) => (
              <View
                key={group.id}
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: theme.colors.surfaceSubtle,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
                    {group.name}
                  </Text>
                  {group.required ? (
                    <Text style={[styles.requiredTag, { color: theme.colors.danger }]}>
                      REQUIRED
                    </Text>
                  ) : (
                    <Text style={[styles.optionalTag, { color: theme.colors.textMuted }]}>
                      OPTIONAL
                    </Text>
                  )}
                </View>

                {group.options.map((choice) => {
                  const isSelected = selectedModifiers.some((m) => m.id === choice.id);
                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={[
                        styles.choiceRow,
                        isSelected && { backgroundColor: theme.colors.surface },
                      ]}
                      onPress={() => toggleModifier(group, choice)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioBox,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.surfaceBorder,
                          },
                        ]}
                      >
                        {isSelected && <Check size={12} color={theme.colors.primary} />}
                      </View>
                      <Text
                        style={[
                          styles.choiceName,
                          {
                            color: isSelected
                              ? theme.colors.textPrimary
                              : theme.colors.textMuted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {choice.name}
                      </Text>
                      {choice.price > 0 && (
                        <Text style={[styles.choicePrice, { color: theme.colors.primary }]}>
                          +₹{choice.price}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <View
              style={[
                styles.defaultCustomization,
                { backgroundColor: theme.colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
                Item Specifications
              </Text>
              <Text style={[styles.itemDesc, { color: theme.colors.textMuted }]}>
                Base price: ₹{item.price}. Standard preparation rules apply.
              </Text>
            </View>
          )}

          {/* Special Instructions Input */}
          <View style={styles.notesGroup}>
            <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
              Special Instructions / Kitchen Notes
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
              placeholder="e.g. Less spicy, extra sauce on side..."
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Quantity Stepper */}
          <View style={styles.quantityRow}>
            <Text style={[styles.groupTitle, { color: theme.colors.textPrimary }]}>
              Quantity
            </Text>
            <View
              style={[
                styles.stepperContainer,
                {
                  backgroundColor: theme.colors.surfaceSubtle,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={16} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.quantityVal, { color: theme.colors.textPrimary }]}>
                {quantity}
              </Text>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: theme.colors.surface }]}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={16} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View style={[styles.footer, { borderColor: theme.colors.surfaceBorder }]}>
          <Button variant="primary" size="lg" fullWidth onPress={handleAdd}>
            Add Item to Order • ₹{grandTotal}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
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
    fontSize: 18,
    fontWeight: '800',
  },
  itemDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  groupCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  defaultCustomization: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  requiredTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  optionalTag: {
    fontSize: 10,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  radioBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  choiceName: {
    flex: 1,
    fontSize: 13,
  },
  choicePrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesGroup: {
    marginBottom: 16,
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 13,
    padding: 12,
    marginTop: 6,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityVal: {
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
