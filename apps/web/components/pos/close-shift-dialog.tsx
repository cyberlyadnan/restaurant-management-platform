"use client";

import type { ZReportDto } from "@nodedr-restaurant/types";
import { Calculator, DollarSign, Lock, ShieldCheck } from "lucide-react";
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
import { useCloseShift } from "@/hooks/use-shifts";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  shiftId: string | null;
  onShiftClosed: (zReport: ZReportDto) => void;
}

const DENOMINATIONS = [
  { label: "$100 Bills", value: 100 },
  { label: "$50 Bills", value: 50 },
  { label: "$20 Bills", value: 20 },
  { label: "$10 Bills", value: 10 },
  { label: "$5 Bills", value: 5 },
  { label: "$1 / Coins", value: 1 },
];

export function CloseShiftDialog({
  open,
  onOpenChange,
  branchId,
  shiftId,
  onShiftClosed,
}: CloseShiftDialogProps) {
  const [actualCash, setActualCash] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showDenominations, setShowDenominations] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  });

  const closeShift = useCloseShift(branchId);

  const handleDenomChange = (value: number, countStr: string) => {
    const count = parseInt(countStr, 10) || 0;
    const newCounts = { ...counts, [value]: count };
    setCounts(newCounts);

    const total = Object.entries(newCounts).reduce(
      (sum, [denom, qty]) => sum + Number(denom) * qty,
      0,
    );
    setActualCash(total > 0 ? total.toFixed(2) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId) return;

    const counted = parseFloat(actualCash);
    if (isNaN(counted) || counted < 0) {
      toast.error("Please enter a valid actual counted cash amount.");
      return;
    }

    closeShift.mutate(
      {
        shiftId,
        dto: {
          actualCash: counted,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: (zReport) => {
          toast.success("Register shift closed successfully!");
          onOpenChange(false);
          setActualCash("");
          setNotes("");
          onShiftClosed(zReport);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to close register shift.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Close Shift & Reconcile</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Perform blind cash count to close register and generate Z-Report.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Blind Count Entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="actualCash" className="text-xs font-semibold text-foreground">
                Total Physical Cash Counted
              </Label>
              <button
                type="button"
                onClick={() => setShowDenominations(!showDenominations)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <Calculator className="h-3 w-3" />
                {showDenominations ? "Hide Calculator" : "Use Denomination Breakdown"}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
              </span>
              <Input
                id="actualCash"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="pl-9 text-lg font-bold"
                required
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Blind count: Enter the exact cash in the drawer. The system will compute variance on submission.
            </p>
          </div>

          {/* Optional Denomination Breakdown */}
          {showDenominations && (
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
              <span className="text-xs font-semibold text-foreground block">
                Denomination Counter
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DENOMINATIONS.map((d) => (
                  <div key={d.value} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-medium">{d.label}:</span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={counts[d.value] || ""}
                      onChange={(e) => handleDenomChange(d.value, e.target.value)}
                      className="w-16 h-7 text-xs text-right font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="closingNotes" className="text-xs font-medium">
              Closing Notes (Optional)
            </Label>
            <Input
              id="closingNotes"
              placeholder="e.g. Closing float left in drawer, cash bag #42 dropped to safe"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs flex gap-2 items-start text-amber-900 dark:text-amber-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              Closing this shift will finalize all drawer accounting, record your blind count, and generate an immutable <strong>Z-Report</strong>.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={closeShift.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={closeShift.isPending}
            >
              {closeShift.isPending ? "Closing Shift..." : "Close Register Shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
