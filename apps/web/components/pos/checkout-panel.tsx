"use client";

import type { PaymentMethodDto } from "@nodedr-restaurant/types";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Gift,
  Minus,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerPicker } from "@/components/pos/customer-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/hooks/use-customers";
import { lookupGiftCard } from "@/hooks/use-gift-cards";
import {
  useCancelOrder,
  useCheckoutOrder,
  type CreatedOrder,
} from "@/hooks/use-orders";
import { usePrintOrderUsb } from "@/hooks/use-print";
import { useSettings } from "@/hooks/use-settings";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { openKotPrint, openReceiptPrint } from "@/lib/print";
import { round2 } from "@/lib/pricing-preview";

const PAYMENT_METHODS: {
  id: PaymentMethodDto;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "UPI", label: "UPI / QR", icon: QrCode },
  { id: "WALLET", label: "Wallet", icon: Wallet },
];

const DISCOUNT_PRESETS = [0, 5, 10, 15, 20];
const TIP_PRESETS = [0, 50, 100, 200];

export function CheckoutPanel({
  order,
  branchId,
  initialCustomer = null,
  onDone,
}: {
  order: CreatedOrder;
  branchId: string | null;
  initialCustomer?: Customer | null;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethodDto>("CASH");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [tipAmount, setTipAmount] = useState("0");
  const [pointsToRedeem, setPointsToRedeem] = useState("0");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [checkingGiftCard, setCheckingGiftCard] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [showGiftCardInput, setShowGiftCardInput] = useState(false);

  const checkout = useCheckoutOrder(branchId);
  const cancelOrder = useCancelOrder(branchId);
  const printUsb = usePrintOrderUsb(branchId);
  const [completed, setCompleted] = useState<CreatedOrder | null>(null);
  const { data: settings } = useSettings(branchId);
  const loyaltyPointValue = Number(settings?.restaurant.loyaltyPointValue ?? 1);

  const discount = Number(discountPercent) || 0;
  const tip = Number(tipAmount) || 0;
  const points = Math.max(0, Math.floor(Number(pointsToRedeem) || 0));

  const rawSubtotal = Number(order.subtotal);
  const discountVal = round2(rawSubtotal * (discount / 100));
  const afterDiscount = round2(rawSubtotal - discountVal);
  const loyaltyDiscount = round2(
    Math.min(points * loyaltyPointValue, afterDiscount),
  );
  const totalDue = round2(afterDiscount - loyaltyDiscount + tip);

  const giftCardApplied =
    giftCardBalance !== null ? round2(Math.min(giftCardBalance, totalDue)) : 0;
  const remainingDue = round2(totalDue - giftCardApplied);

  const checkGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setCheckingGiftCard(true);
    try {
      const card = await lookupGiftCard(branchId, giftCardCode.trim());
      if (!card) {
        toast.error("No gift card found with that code");
        setGiftCardBalance(null);
        return;
      }
      setGiftCardBalance(Number(card.balance));
      toast.success(`Gift card applied: ${formatCurrency(Number(card.balance))}`);
    } catch {
      toast.error("Error looking up gift card");
    } finally {
      setCheckingGiftCard(false);
    }
  };

  const handleCheckout = () => {
    checkout.mutate(
      {
        orderId: order.id,
        dto: {
          customerId: customer?.id,
          discountPercent: discount,
          tipAmount: tip,
          loyaltyPointsToRedeem: points > 0 ? points : undefined,
          giftCardCode: giftCardBalance !== null ? giftCardCode : undefined,
          payments: remainingDue > 0 ? [{ method, amount: remainingDue }] : [],
        },
      },
      {
        onSuccess: (result) => {
          setCompleted(result);
          toast.success("Payment successful!");
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Checkout failed"),
      },
    );
  };

  const handleCancel = () => {
    if (!confirm(`Cancel order #${order.orderNumber}? This cannot be undone.`))
      return;
    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        toast.success(`Order #${order.orderNumber} cancelled`);
        onDone();
      },
      onError: (err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Could not cancel order",
        ),
    });
  };

  // Payment completed screen
  if (completed) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mb-4 ring-8 ring-emerald-500/10 animate-in zoom-in-95">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
          Order #{order.orderNumber}
        </span>
        <h3 className="mt-2 text-xl font-bold text-foreground">
          Payment Completed
        </h3>
        <p className="text-3xl font-black tabular-nums text-foreground mt-1">
          {formatCurrency(completed.totalAmount)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Settled via <span className="font-semibold text-foreground">{method}</span>
        </p>

        {Number(completed.loyaltyDiscountAmount) > 0 && (
          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
            {completed.loyaltyPointsRedeemed} loyalty points redeemed (Saved {formatCurrency(completed.loyaltyDiscountAmount)})
          </p>
        )}

        <div className="mt-6 flex flex-col w-full max-w-xs gap-2.5">
          <Button
            variant="outline"
            className="h-10 w-full gap-2 text-xs font-semibold"
            onClick={() => branchId && openReceiptPrint(completed.id, branchId)}
          >
            <Printer className="h-4 w-4" />
            Print Thermal Receipt
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full gap-2 text-xs font-semibold"
            disabled={printUsb.isPending}
            onClick={() =>
              printUsb.mutate(completed.id, {
                onSuccess: () => toast.success("Sent to USB receipt printer"),
                onError: (err) =>
                  toast.error(
                    err instanceof ApiError
                      ? err.message
                      : "Could not print to USB printer",
                  ),
              })
            }
          >
            <Receipt className="h-4 w-4" />
            {printUsb.isPending ? "Printing…" : "Print via USB Printer"}
          </Button>
          <Button
            className="h-11 w-full bg-primary text-primary-foreground font-bold text-sm shadow-md"
            onClick={onDone}
          >
            Next Order / New Table
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Pinned Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-border/70 p-3.5 sm:px-4 shrink-0 bg-muted/20">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground -ml-1"
          onClick={onDone}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Menu</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 px-2.5 text-xs font-medium"
            onClick={() => branchId && openKotPrint(order.id, branchId)}
            title="Print Kitchen Order Ticket"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>KOT</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={cancelOrder.isPending}
            onClick={handleCancel}
            title="Cancel this order"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cancel</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
        {/* Order Header Summary Card */}
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 to-muted/10 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Order #{order.orderNumber}
            </span>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              In Kitchen
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-black tabular-nums text-foreground">
                {formatCurrency(rawSubtotal)}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                incl. {formatCurrency(order.taxAmount)} GST / Tax
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              Bill Pending
            </span>
          </div>
        </div>

        {/* Customer Attachment */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Customer / Loyalty
          </Label>
          <CustomerPicker
            branchId={branchId}
            customer={customer}
            onSelect={setCustomer}
          />
        </div>

        {/* Loyalty Points Redemption (if available) */}
        {customer && customer.loyaltyPoints > 0 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Loyalty Points Available: {customer.loyaltyPoints}
              </span>
              <button
                type="button"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                onClick={() =>
                  setPointsToRedeem(
                    String(
                      Math.min(
                        customer.loyaltyPoints,
                        Math.floor(afterDiscount / loyaltyPointValue),
                      ),
                    ),
                  )
                }
              >
                Redeem Max
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max={customer.loyaltyPoints}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(e.target.value)}
                placeholder="Points to redeem"
                className="h-8 text-xs bg-background"
              />
              {points > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  - {formatCurrency(loyaltyDiscount)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Discount Section with 1-Touch Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">
              Discount %
            </Label>
            {discount > 0 && (
              <span className="text-xs font-bold text-rose-500">
                - {formatCurrency(discountVal)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {DISCOUNT_PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPercent(String(pct))}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                  discount === pct
                    ? "bg-foreground text-background shadow-xs"
                    : "border border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {pct}%
              </button>
            ))}
            <div className="w-16 shrink-0">
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="h-8 text-xs text-center font-bold px-1"
                placeholder="Custom"
              />
            </div>
          </div>
        </div>

        {/* Tip / Gratuity with 1-Touch Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">
              Tip / Gratuity
            </Label>
            {tip > 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                + {formatCurrency(tip)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {TIP_PRESETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipAmount(String(t))}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${
                  tip === t
                    ? "bg-foreground text-background shadow-xs"
                    : "border border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {t === 0 ? "None" : `+₹${t}`}
              </button>
            ))}
            <div className="w-16 shrink-0">
              <Input
                type="number"
                min="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="h-8 text-xs text-center font-bold px-1"
                placeholder="Custom"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Visual Tiles */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">
            Select Payment Method
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              const isSelected = method === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 shadow-xs"
                      : "border-border/70 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-bold leading-tight">
                    {pm.label}
                  </span>
                  {isSelected && (
                    <span className="mt-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2 w-2" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gift Card Accordion/Toggle */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-2.5">
          {!showGiftCardInput && giftCardBalance === null ? (
            <button
              type="button"
              onClick={() => setShowGiftCardInput(true)}
              className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-primary" />
                Have a Gift Card / Voucher?
              </span>
              <span className="text-primary font-bold">+ Add</span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  Gift Card Code
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiftCardInput(false);
                    setGiftCardCode("");
                    setGiftCardBalance(null);
                  }}
                  className="text-[11px] text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={giftCardCode}
                  onChange={(e) => {
                    setGiftCardCode(e.target.value);
                    setGiftCardBalance(null);
                  }}
                  placeholder="Enter gift card code"
                  className="h-8 text-xs font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold shrink-0"
                  disabled={!giftCardCode.trim() || checkingGiftCard}
                  onClick={checkGiftCard}
                >
                  {checkingGiftCard ? "…" : "Apply"}
                </Button>
              </div>
              {giftCardBalance !== null && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Balance {formatCurrency(giftCardBalance)} — Applied: {formatCurrency(giftCardApplied)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Split Bill Calculator */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Users className="h-3.5 w-3.5" />
            <span>Split Bill:</span>
            {splitCount > 1 && (
              <span className="font-bold text-primary">
                {formatCurrency(round2(totalDue / splitCount))} / person
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSplitCount((prev) => Math.max(1, prev - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-xs font-bold tabular-nums">
              {splitCount}p
            </span>
            <button
              type="button"
              onClick={() => setSplitCount((prev) => prev + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* PINNED BOTTOM FOOTER (Never Cut Off) */}
      <div className="border-t border-border/80 bg-background/95 p-3.5 sm:px-4 shrink-0 shadow-lg space-y-2.5">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold text-foreground">
              {formatCurrency(rawSubtotal)}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-rose-500 font-medium">
              <span>Discount ({discount}%)</span>
              <span className="tabular-nums font-semibold">
                - {formatCurrency(discountVal)}
              </span>
            </div>
          )}

          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Loyalty Points</span>
              <span className="tabular-nums font-semibold">
                - {formatCurrency(loyaltyDiscount)}
              </span>
            </div>
          )}

          {tip > 0 && (
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Tip</span>
              <span className="tabular-nums font-semibold text-foreground">
                + {formatCurrency(tip)}
              </span>
            </div>
          )}

          <div className="border-t border-border/60 pt-1.5 flex justify-between items-baseline">
            <span className="text-sm font-bold text-foreground">Total Due</span>
            <span className="text-xl font-black tabular-nums text-primary">
              {formatCurrency(totalDue)}
            </span>
          </div>
        </div>

        <Button
          className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          disabled={checkout.isPending}
          onClick={handleCheckout}
        >
          {checkout.isPending ? (
            <span>Processing Payment…</span>
          ) : (
            <>
              <span>Complete Payment • {formatCurrency(remainingDue)}</span>
              <Check className="h-4 w-4 stroke-[3]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
