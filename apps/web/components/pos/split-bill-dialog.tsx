"use client";

import type { PaymentMethodDto } from "@nodedr-restaurant/types";
import {
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  Printer,
  QrCode,
  Receipt,
  Split,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useRecordPartialPayment,
  type CreatedOrder,
} from "@/hooks/use-orders";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { openReceiptPrint } from "@/lib/print";
import { round2 } from "@/lib/pricing-preview";

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: CreatedOrder;
  branchId: string | null;
  totalDue: number;
  onFullyPaid: (completedOrder: CreatedOrder) => void;
}

const PAYMENT_METHODS: {
  id: PaymentMethodDto;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "UPI", label: "UPI", icon: QrCode },
  { id: "WALLET", label: "Wallet", icon: Wallet },
];

export function SplitBillDialog({
  open,
  onOpenChange,
  order,
  branchId,
  totalDue,
  onFullyPaid,
}: SplitBillDialogProps) {
  const [splitCount, setSplitCount] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<string>("equal");

  // Track payments made in this split session
  const [guestMethods, setGuestMethods] = useState<Record<number, PaymentMethodDto>>({
    1: "CARD",
    2: "CASH",
    3: "CARD",
    4: "UPI",
    5: "CASH",
  });
  const [paidGuests, setPaidGuests] = useState<
    Record<number, { paymentId: string; amount: number; method: string }>
  >({});

  // Custom partial payment state
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customPayerName, setCustomPayerName] = useState<string>("");
  const [customMethod, setCustomMethod] = useState<PaymentMethodDto>("CASH");

  const recordPartialPayment = useRecordPartialPayment(branchId);

  // Compute existing payments already registered on the order
  const existingPaymentsTotal = round2(
    (order.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0),
  );
  const sessionPaymentsTotal = round2(
    Object.values(paidGuests).reduce((sum, p) => sum + p.amount, 0),
  );
  const totalPaidSoFar = round2(existingPaymentsTotal + sessionPaymentsTotal);
  const remainingDue = round2(Math.max(0, totalDue - totalPaidSoFar));
  const progressPercent = Math.min(100, round2((totalPaidSoFar / totalDue) * 100));

  // Equal split calculation
  const sharePerGuest = round2(totalDue / splitCount);

  const handlePayEqualGuest = (guestIndex: number) => {
    const method = guestMethods[guestIndex] ?? "CASH";
    const amountToPay = Math.min(sharePerGuest, remainingDue);

    recordPartialPayment.mutate(
      {
        orderId: order.id,
        dto: {
          payment: {
            method,
            amount: amountToPay,
            payerName: `Guest ${guestIndex} of ${splitCount}`,
          },
        },
      },
      {
        onSuccess: (res) => {
          setPaidGuests((prev) => ({
            ...prev,
            [guestIndex]: {
              paymentId: res.payment.id,
              amount: amountToPay,
              method,
            },
          }));
          toast.success(`Guest #${guestIndex} payment of ${formatCurrency(amountToPay)} recorded!`);

          if (res.isFullyPaid) {
            toast.success("Order bill is now fully settled!");
            onOpenChange(false);
            onFullyPaid(res.order);
          }
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Payment failed.");
        },
      },
    );
  };

  const handleCustomPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    recordPartialPayment.mutate(
      {
        orderId: order.id,
        dto: {
          payment: {
            method: customMethod,
            amount,
            payerName: customPayerName.trim() || undefined,
          },
        },
      },
      {
        onSuccess: (res) => {
          toast.success(`Partial payment of ${formatCurrency(amount)} recorded!`);
          setCustomAmount("");
          setCustomPayerName("");

          if (res.isFullyPaid) {
            toast.success("Order bill is now fully settled!");
            onOpenChange(false);
            onFullyPaid(res.order);
          }
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Payment failed.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Split className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Split Bill — Order #{order.orderNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Divide the bill evenly across diners or collect partial payments sequentially.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Balance Status Banner */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <div>
              <span className="text-muted-foreground">Total Bill: </span>
              <strong className="text-foreground text-sm font-bold">
                {formatCurrency(totalDue)}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">Collected: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatCurrency(totalPaidSoFar)}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining: </span>
              <strong className="text-primary text-base font-extrabold">
                {formatCurrency(remainingDue)}
              </strong>
            </div>
          </div>

          {/* Live Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/60">
            <div
              className="bg-emerald-500 h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equal" className="text-xs font-semibold gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Split Evenly (by Guest)
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs font-semibold gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Custom Partial Amount
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SPLIT EVENLY */}
          <TabsContent value="equal" className="space-y-4 pt-3">
            {/* Split Counter Selector */}
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 bg-card">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Number of Diners:
                </span>
                <span className="text-xs font-bold text-primary">
                  {formatCurrency(sharePerGuest)} each
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSplitCount((c) => Math.max(2, c - 1))}
                  disabled={splitCount <= 2 || Object.keys(paidGuests).length > 0}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-7 text-center text-xs font-bold tabular-nums">
                  {splitCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSplitCount((c) => Math.min(10, c + 1))}
                  disabled={splitCount >= 10 || Object.keys(paidGuests).length > 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Guest Split Payment Cards */}
            <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              {Array.from({ length: splitCount }, (_, i) => i + 1).map((guestNum) => {
                const isPaid = !!paidGuests[guestNum];
                const selectedMethod = guestMethods[guestNum] ?? "CASH";

                return (
                  <div
                    key={guestNum}
                    className={`rounded-xl border p-3 transition-all ${
                      isPaid
                        ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-border/80 bg-card hover:border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            isPaid
                              ? "bg-emerald-500 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {isPaid ? <Check className="h-4 w-4" /> : `#${guestNum}`}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-foreground">
                            Guest #{guestNum}
                          </span>
                          <p className="text-xs font-semibold text-primary">
                            {formatCurrency(sharePerGuest)}
                          </p>
                        </div>
                      </div>

                      {isPaid ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/40 text-[11px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Paid via {paidGuests[guestNum].method}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => branchId && openReceiptPrint(order.id, branchId)}
                          >
                            <Printer className="h-3 w-3" />
                            Slip
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Method Selector */}
                          <div className="flex gap-1">
                            {PAYMENT_METHODS.map((pm) => (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() =>
                                  setGuestMethods((prev) => ({
                                    ...prev,
                                    [guestNum]: pm.id,
                                  }))
                                }
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold border transition-all ${
                                  selectedMethod === pm.id
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/40 text-muted-foreground hover:bg-muted border-border"
                                }`}
                              >
                                {pm.label}
                              </button>
                            ))}
                          </div>

                          <Button
                            size="sm"
                            className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={remainingDue <= 0 || recordPartialPayment.isPending}
                            onClick={() => handlePayEqualGuest(guestNum)}
                          >
                            Pay Share
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: CUSTOM PARTIAL AMOUNT */}
          <TabsContent value="custom" className="space-y-4 pt-3">
            <form onSubmit={handleCustomPayment} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="customPayerName" className="text-xs font-medium">
                  Payer / Diner Name (Optional)
                </Label>
                <Input
                  id="customPayerName"
                  placeholder="e.g. Alice, Seat 3, Cash portion"
                  value={customPayerName}
                  onChange={(e) => setCustomPayerName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customAmount" className="text-xs font-medium">
                  Amount to Pay (Remaining: {formatCurrency(remainingDue)})
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <Input
                    id="customAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingDue}
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-9 font-bold text-base"
                    required
                  />
                </div>
              </div>

              {/* Tender Methods */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Payment Tender</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = customMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setCustomMethod(pm.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                            : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={remainingDue <= 0 || recordPartialPayment.isPending}
              >
                {recordPartialPayment.isPending ? "Recording Payment..." : "Record Partial Payment"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
