import React, { createContext, useContext, useState } from 'react';

export interface MobileCartLine {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  modifierIds: string[];
  modifierLabel?: string;
  isVeg: boolean;
}

interface CartContextValue {
  lines: MobileCartLine[];
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableId: string | null;
  tableName: string | null;
  kitchenNote: string;
  totalCount: number;
  subtotal: number;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  setTable: (id: string | null, name: string | null) => void;
  setKitchenNote: (note: string) => void;
  addItem: (
    item: { id: string; name: string; price: string | number; isVeg: boolean },
    modifierIds?: string[],
    modifierLabel?: string,
    modifierPriceDelta?: number,
  ) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<MobileCartLine[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [kitchenNote, setKitchenNote] = useState<string>('');

  const totalCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const addItem = (
    item: { id: string; name: string; price: string | number; isVeg: boolean },
    modifierIds: string[] = [],
    modifierLabel: string = '',
    modifierPriceDelta: number = 0,
  ) => {
    const key = `${item.id}::${[...modifierIds].sort().join(',')}`;
    const unitPrice = Number(item.price) + modifierPriceDelta;

    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity: 1,
          modifierIds,
          modifierLabel,
          isVeg: item.isVeg,
        },
      ];
    });
  };

  const increment = (key: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)),
    );
  };

  const decrement = (key: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const clearCart = () => {
    setLines([]);
    setKitchenNote('');
  };

  const setTable = (id: string | null, name: string | null) => {
    setTableId(id);
    setTableName(name);
  };

  return (
    <CartContext.Provider
      value={{
        lines,
        orderType,
        tableId,
        tableName,
        kitchenNote,
        totalCount,
        subtotal,
        setOrderType,
        setTable,
        setKitchenNote,
        addItem,
        increment,
        decrement,
        removeLine,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
