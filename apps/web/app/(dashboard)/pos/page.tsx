"use client";

import { ArrowRight, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { CartPanel } from "@/components/pos/cart-panel";
import { cartLineKey, type CartLine } from "@/components/pos/cart-line";
import { CheckoutPanel } from "@/components/pos/checkout-panel";
import { FullCartDialog } from "@/components/pos/full-cart-dialog";
import { KitchenProgressWidget } from "@/components/pos/kitchen-progress-widget";
import { ModifierPickerDialog } from "@/components/pos/modifier-picker-dialog";
import { PosTablePicker } from "@/components/pos/pos-table-picker";
import { ProductGrid } from "@/components/pos/product-grid";
import { Card } from "@/components/ui/card";
import { useBranch } from "@/hooks/use-branch";
import type { MenuItem } from "@/hooks/use-menu";
import {
  useAddOrderItems,
  useCreateOrder,
  useOpenOrdersForTable,
  type CreatedOrder,
} from "@/hooks/use-orders";
import { useFloors, type RestaurantTable } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { subtotalOf } from "@/lib/pricing-preview";
import { cn } from "@/lib/utils";

export default function PosPage() {
  return (
    <Suspense fallback={null}>
      <PosPageInner />
    </Suspense>
  );
}

function PosPageInner() {
  const { branchId } = useBranch();
  const { data: floors } = useFloors(branchId);
  const tables = floors?.flatMap((f) => f.tables) ?? [];
  const preselectedTableId = useSearchParams().get("tableId") ?? "";

  const [lines, setLines] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [tableId, setTableId] = useState(preselectedTableId);
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<CreatedOrder | null>(null);
  const [fullCartOpen, setFullCartOpen] = useState(false);

  const createOrder = useCreateOrder(branchId);
  const addOrderItems = useAddOrderItems(branchId);
  const { data: existingOrders } = useOpenOrdersForTable(
    branchId,
    orderType === "DINE_IN" ? tableId || null : null,
  );
  const existingOrder = existingOrders?.[0];

  const addLine = (
    menuItemId: string,
    name: string,
    unitPrice: number,
    modifierIds: string[],
    modifierLabel: string,
    isVeg?: boolean,
  ) => {
    const key = cartLineKey(menuItemId, modifierIds);
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
          menuItemId,
          name,
          unitPrice,
          quantity: 1,
          modifierIds,
          modifierLabel,
          isVeg,
        },
      ];
    });
  };

  const handleSelect = (item: MenuItem) => {
    if (item.modifierGroups.length > 0) {
      setPickerItem(item);
      return;
    }
    addLine(item.id, item.name, Number(item.price), [], "", item.isVeg);
  };

  const handleModifierConfirm = (
    modifierIds: string[],
    modifierLabel: string,
  ) => {
    if (!pickerItem) return;
    const modifierTotal = modifierIds.reduce((sum, id) => {
      const mod = pickerItem.modifierGroups
        .flatMap((g) => g.modifierGroup.modifiers)
        .find((m) => m.id === id);
      return sum + (mod ? Number(mod.priceAdjustment) : 0);
    }, 0);
    addLine(
      pickerItem.id,
      pickerItem.name,
      Number(pickerItem.price) + modifierTotal,
      modifierIds,
      modifierLabel,
      pickerItem.isVeg,
    );
  };

  const updateQuantity = (key: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const handleItemIncrement = (item: MenuItem) => {
    const line = lines.find((l) => l.menuItemId === item.id);
    if (line) {
      updateQuantity(line.key, 1);
    } else {
      handleSelect(item);
    }
  };

  const handleItemDecrement = (item: MenuItem) => {
    const line = [...lines].reverse().find((l) => l.menuItemId === item.id);
    if (line) {
      updateQuantity(line.key, -1);
    }
  };

  const removeLine = (key: string) =>
    setLines((prev) => prev.filter((l) => l.key !== key));

  const clearCart = () => setLines([]);

  const handleSubmit = (kitchenNote?: string) => {
    const items = lines.map((l) => ({
      menuItemId: l.menuItemId,
      quantity: l.quantity,
      modifierIds: l.modifierIds,
    }));

    if (existingOrder) {
      addOrderItems.mutate(
        { orderId: existingOrder.id, dto: { items } },
        {
          onSuccess: (order) => {
            setActiveOrder(order);
            setLines([]);
            toast.success(`Added to order #${order.orderNumber} — sent to kitchen`);
          },
          onError: (err) =>
            toast.error(
              err instanceof ApiError ? err.message : "Could not add items",
            ),
        },
      );
      return;
    }

    createOrder.mutate(
      {
        type: orderType,
        tableId: orderType === "DINE_IN" ? tableId : undefined,
        notes: kitchenNote,
        items,
      },
      {
        onSuccess: (order) => {
          setActiveOrder(order);
          setLines([]);
          toast.success(`Order #${order.orderNumber} sent to kitchen`);
        },
        onError: (err) =>
          toast.error(
            err instanceof ApiError ? err.message : "Could not create order",
          ),
      },
    );
  };

  const viewExistingOrder = () => {
    if (existingOrder) setActiveOrder(existingOrder);
  };

  const resetForNewOrder = () => {
    setActiveOrder(null);
    setLines([]);
    setTableId("");
  };

  const handleTablePick = (table: RestaurantTable) => setTableId(table.id);

  const showTablePicker =
    orderType === "DINE_IN" && !tableId && !activeOrder;

  const totalCartCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const cartSubtotal = subtotalOf(lines.map((l) => l.unitPrice * l.quantity));

  return (
    <div className="relative flex h-[calc(100vh-7.5rem)] flex-col gap-3">
      <KitchenProgressWidget branchId={branchId} />

      {showTablePicker ? (
        <Card className="flex-1 overflow-hidden p-5 rounded-2xl border-border/80 shadow-xs">
          <PosTablePicker floors={floors ?? []} onSelect={handleTablePick} />
        </Card>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px]">
          {/* Main Surface: ProductGrid (Desktop) or hidden on mobile when activeOrder is being checked out */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border-border/80 shadow-xs flex-col flex-1",
              activeOrder ? "hidden lg:flex p-4 sm:p-5" : "flex p-4 sm:p-5",
            )}
          >
            <ProductGrid
              branchId={branchId}
              onSelect={handleSelect}
              cartLines={lines}
              onIncrement={handleItemIncrement}
              onDecrement={handleItemDecrement}
            />
          </Card>

          {/* Mobile Full-Screen Checkout (if activeOrder on screens < lg) */}
          {activeOrder && (
            <Card className="flex lg:hidden flex-col overflow-hidden p-0 rounded-2xl border-border/80 shadow-xs flex-1">
              <CheckoutPanel
                order={activeOrder}
                branchId={branchId}
                initialCustomer={existingOrder?.customer}
                onDone={resetForNewOrder}
              />
            </Card>
          )}

          {/* Desktop Right Panel: Cart or Checkout */}
          <Card
            className={cn(
              "hidden lg:flex flex-col overflow-hidden rounded-2xl border-border/80 shadow-xs",
              activeOrder ? "p-0" : "p-4 sm:p-5",
            )}
          >
            {activeOrder ? (
              <CheckoutPanel
                order={activeOrder}
                branchId={branchId}
                initialCustomer={existingOrder?.customer}
                onDone={resetForNewOrder}
              />
            ) : (
              <CartPanel
                lines={lines}
                orderType={orderType}
                onOrderTypeChange={setOrderType}
                tables={tables}
                tableId={tableId}
                onTableChange={setTableId}
                onIncrement={(key) => updateQuantity(key, 1)}
                onDecrement={(key) => updateQuantity(key, -1)}
                onRemove={removeLine}
                onOpenFullCart={() => setFullCartOpen(true)}
                onSubmit={() => handleSubmit()}
                isSubmitting={createOrder.isPending || addOrderItems.isPending}
                existingOrderNumber={existingOrder?.orderNumber}
                onViewExistingOrder={
                  existingOrder ? viewExistingOrder : undefined
                }
              />
            )}
          </Card>
        </div>
      )}

      {/* Zomato-Style Mobile / Tablet Sticky Cart Bar */}
      {!activeOrder && totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => setFullCartOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-xl hover:bg-emerald-700 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold leading-none text-emerald-100">
                  {totalCartCount} {totalCartCount === 1 ? "item" : "items"} added
                </p>
                <p className="text-base font-black tabular-nums leading-tight mt-0.5">
                  {formatCurrency(cartSubtotal)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/15 px-3.5 py-2 rounded-xl">
              <span>View Full Cart</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Full Cart Review Dialog */}
      <FullCartDialog
        open={fullCartOpen}
        onOpenChange={setFullCartOpen}
        lines={lines}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        tables={tables}
        tableId={tableId}
        onTableChange={setTableId}
        onIncrement={(key) => updateQuantity(key, 1)}
        onDecrement={(key) => updateQuantity(key, -1)}
        onRemove={removeLine}
        onClearCart={clearCart}
        onSubmit={(note) => handleSubmit(note)}
        isSubmitting={createOrder.isPending || addOrderItems.isPending}
        existingOrderNumber={existingOrder?.orderNumber}
        onViewExistingOrder={existingOrder ? viewExistingOrder : undefined}
      />

      {/* Modifier Picker Dialog */}
      <ModifierPickerDialog
        item={pickerItem}
        open={!!pickerItem}
        onOpenChange={(open) => !open && setPickerItem(null)}
        onConfirm={handleModifierConfirm}
      />
    </div>
  );
}
