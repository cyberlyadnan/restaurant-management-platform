"use client";

import {
  AlertCircle,
  ArrowRight,
  ChefHat,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { DietaryBadge } from "@/components/pos/dietary-badge";
import type { CartLine } from "@/components/pos/cart-line";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RestaurantTable } from "@/hooks/use-tables";
import { formatCurrency } from "@/lib/format";
import { subtotalOf } from "@/lib/pricing-preview";

interface FullCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  orderType: "DINE_IN" | "TAKEAWAY";
  onOrderTypeChange: (type: "DINE_IN" | "TAKEAWAY") => void;
  tables: RestaurantTable[];
  tableId: string;
  onTableChange: (tableId: string) => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onClearCart?: () => void;
  onSubmit: (note?: string) => void;
  isSubmitting: boolean;
  existingOrderNumber?: string;
  onViewExistingOrder?: () => void;
}

const PRESET_NOTES = [
  "🌶️ Extra Spicy",
  "🧂 Less Salt",
  "🚫 No Onion / Garlic",
  "🧊 Extra Ice",
  "🥛 Less Oil",
  "📦 Pack Separately",
  "🔥 Serve Extra Hot",
];

export function FullCartDialog({
  open,
  onOpenChange,
  lines,
  orderType,
  onOrderTypeChange,
  tables,
  tableId,
  onTableChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClearCart,
  onSubmit,
  isSubmitting,
  existingOrderNumber,
  onViewExistingOrder,
}: FullCartDialogProps) {
  const [kitchenNote, setKitchenNote] = useState("");

  const totalItemsCount = lines.reduce((acc, l) => acc + l.quantity, 0);
  const subtotal = subtotalOf(lines.map((l) => l.unitPrice * l.quantity));
  const selectedTable = tables.find((t) => t.id === tableId);
  const canSubmit =
    lines.length > 0 &&
    (orderType === "TAKEAWAY" || !!tableId) &&
    !isSubmitting;

  const addPresetNote = (note: string) => {
    setKitchenNote((prev) => {
      if (prev.includes(note)) return prev;
      return prev ? `${prev}, ${note}` : note;
    });
  };

  const handleFinalSubmit = () => {
    onSubmit(kitchenNote.trim() || undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl backdrop-blur-xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Review Full Cart & Order
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} in order
                {orderType === "DINE_IN" && selectedTable
                  ? ` • Table ${selectedTable.name ?? selectedTable.number}`
                  : " • Takeaway"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          {/* Order Type & Table Selection Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="w-full sm:w-56 shrink-0">
              <Tabs
                value={orderType}
                onValueChange={(v) => onOrderTypeChange(v as "DINE_IN" | "TAKEAWAY")}
              >
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="DINE_IN" className="text-xs font-semibold">
                    Dine-in
                  </TabsTrigger>
                  <TabsTrigger value="TAKEAWAY" className="text-xs font-semibold">
                    Takeaway
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {orderType === "DINE_IN" && (
              <div className="flex-1 min-w-[200px]">
                <Select
                  value={tableId}
                  onValueChange={(v) => onTableChange(v ?? "")}
                >
                  <SelectTrigger className="h-9 w-full text-xs font-medium">
                    <SelectValue placeholder="Assign a Table">
                      {(value: string | null) => {
                        const t = tables.find((table) => table.id === value);
                        if (!t) return "Select table for Dine-in";
                        return `${t.name ?? `Table ${t.number}`}${t.status === "OCCUPIED" ? " (occupied)" : ""}`;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.name ?? `Table ${t.number}`}{" "}
                        {t.status === "OCCUPIED" ? "• Occupied" : "• Available"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Existing Open Order Banner */}
          {existingOrderNumber && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Table has active open order{" "}
                  <strong className="underline">#{existingOrderNumber}</strong>. These items will be fired to kitchen as <strong>Round 2</strong>.
                </span>
              </div>
              {onViewExistingOrder && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 text-xs font-semibold border-blue-500/30 hover:bg-blue-500/20"
                  onClick={onViewExistingOrder}
                >
                  View Bill
                </Button>
              )}
            </div>
          )}

          {/* Itemized Cart List */}
          <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
            <div className="border-b border-border/60 bg-muted/40 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
              <span>Order Items ({totalItemsCount})</span>
              {onClearCart && lines.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-[11px] text-destructive hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <UtensilsCrossed className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="text-sm font-medium">Your cart is currently empty</p>
                <p className="text-xs mt-0.5">Add dishes from the menu to see them here</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[260px] overflow-y-auto">
                {lines.map((line) => (
                  <div
                    key={line.key}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-0.5">
                        <DietaryBadge isVeg={line.isVeg ?? true} size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {line.name}
                        </p>
                        {line.modifierLabel && (
                          <span className="inline-block text-[11px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded mt-0.5">
                            {line.modifierLabel}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(line.unitPrice)} each
                        </p>
                      </div>
                    </div>

                    {/* Zomato-Style In-Cart Stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onDecrement(line.key)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/20 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold tabular-nums text-foreground">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrement(line.key)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/20 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-semibold text-sm tabular-nums text-foreground">
                        {formatCurrency(line.unitPrice * line.quantity)}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(line.key)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kitchen Cooking Notes & Special Requests */}
          <div className="rounded-xl border border-border/70 p-3 bg-muted/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ChefHat className="h-3.5 w-3.5 text-orange-500" />
              <span>Special Kitchen / Chef Instructions</span>
            </div>
            <input
              type="text"
              value={kitchenNote}
              onChange={(e) => setKitchenNote(e.target.value)}
              placeholder="e.g. Less spicy, pack gravy separately, serve extra crispy..."
              className="h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
            />
            {/* Quick preset tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {PRESET_NOTES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addPresetNote(preset)}
                  className="rounded-md border border-border/60 bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-2xs"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Bill Summary Breakdown */}
          <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Item Subtotal ({totalItemsCount} items)</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Taxes & GST (Included in menu prices)</span>
              <span className="tabular-nums">Included</span>
            </div>
            <div className="border-t border-border/60 pt-2 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-foreground">To Pay (Grand Total)</span>
                <p className="text-[10px] text-muted-foreground">Prices inclusive of applicable taxes</p>
              </div>
              <span className="text-lg font-black tabular-nums text-primary">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/40 p-4 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl text-xs font-semibold"
          >
            + Add More Dishes
          </Button>

          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleFinalSubmit}
            className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Firing to Kitchen…</span>
            ) : existingOrderNumber ? (
              <>
                <span>Add to Order #{existingOrderNumber} & Fire (KOT)</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Confirm & Send to Kitchen (KOT)</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
