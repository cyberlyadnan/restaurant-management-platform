"use client";

import type { CashMovementTypeDto } from "@nodedr-restaurant/types";
import { ArrowDownLeft, ArrowUpRight, DollarSign, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useRecordCashMovement } from "@/hooks/use-shifts";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  shiftId: string | null;
  currentExpectedCash: number;
}

const COMMON_REASONS: Record<CashMovementTypeDto, string[]> = {
  PAID_IN: ["Change from bank", "Added float", "Cash deposit correction"],
  PAID_OUT: ["Office/cleaning supplies", "Vendor COD payment", "Petty cash payout", "Kitchen produce run"],
  DROP: ["Safe drop (excess cash)", "Mid-day deposit drop", "Shift end drop to main safe"],
};

export function CashMovementDialog({
  open,
  onOpenChange,
  branchId,
  shiftId,
  currentExpectedCash,
}: CashMovementDialogProps) {
  const [type, setType] = useState<CashMovementTypeDto>("PAID_IN");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const recordMovement = useRecordCashMovement(branchId);

  const numAmount = parseFloat(amount) || 0;
  const projectedExpectedCash =
    type === "PAID_IN"
      ? currentExpectedCash + numAmount
      : Math.max(0, currentExpectedCash - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId) return;

    if (numAmount <= 0) {
      toast.error("Please enter an amount greater than 0.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please specify a reason for this cash movement.");
      return;
    }

    if (type !== "PAID_IN" && numAmount > currentExpectedCash) {
      toast.warning("Warning: Payout amount exceeds current expected cash in drawer.");
    }

    recordMovement.mutate(
      {
        shiftId,
        dto: {
          type,
          amount: numAmount,
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `${type === "PAID_IN" ? "Paid In" : type === "DROP" ? "Safe Drop" : "Paid Out"} recorded successfully!`,
          );
          onOpenChange(false);
          setAmount("");
          setReason("");
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to record cash movement.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Cash Movement</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Record cash added to or removed from the register drawer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Movement Type Toggle */}
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-muted/60 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setType("PAID_IN");
              setReason("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-all ${
              type === "PAID_IN"
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            Paid In
          </button>
          <button
            type="button"
            onClick={() => {
              setType("PAID_OUT");
              setReason("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-all ${
              type === "PAID_OUT"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Paid Out
          </button>
          <button
            type="button"
            onClick={() => {
              setType("DROP");
              setReason("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition-all ${
              type === "DROP"
                ? "bg-sky-600 text-white shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Safe Drop
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="movementAmount" className="text-xs font-medium">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
              </span>
              <Input
                id="movementAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-base font-semibold"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movementReason" className="text-xs font-medium">
              Reason / Description
            </Label>
            <Input
              id="movementReason"
              placeholder="e.g. Bank change, delivery payout, petty cash"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
              required
            />
            {/* Quick Reason Suggestions */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {COMMON_REASONS[type].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-md px-2 py-0.5 text-[11px] transition-colors border ${
                    reason === r
                      ? "bg-accent text-accent-foreground border-accent-foreground/30 font-medium"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Impact Summary Card */}
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Current Drawer Cash:</span>
              <span className="font-medium text-foreground">{formatCurrency(currentExpectedCash)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Movement:</span>
              <span
                className={`font-semibold ${
                  type === "PAID_IN" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {type === "PAID_IN" ? "+" : "-"}
                {formatCurrency(numAmount)}
              </span>
            </div>
            <div className="border-t border-border/50 pt-1.5 flex justify-between font-medium">
              <span>Projected Drawer Cash:</span>
              <span className="text-primary font-bold">{formatCurrency(projectedExpectedCash)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={recordMovement.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className={
                type === "PAID_IN"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : type === "DROP"
                  ? "bg-sky-600 hover:bg-sky-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }
              disabled={recordMovement.isPending}
            >
              {recordMovement.isPending ? "Recording..." : `Record ${type === "PAID_IN" ? "Paid In" : type === "DROP" ? "Drop" : "Paid Out"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
