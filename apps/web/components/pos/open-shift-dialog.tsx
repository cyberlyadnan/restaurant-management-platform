"use client";

import { DollarSign, LockOpen, Sparkles } from "lucide-react";
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
import { useOpenShift } from "@/hooks/use-shifts";
import { ApiError } from "@/lib/api";

const QUICK_FLOATS = [50, 100, 150, 200, 300, 500];

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
}

export function OpenShiftDialog({ open, onOpenChange, branchId }: OpenShiftDialogProps) {
  const [startingCash, setStartingCash] = useState<string>("150");
  const [notes, setNotes] = useState<string>("");
  const openShift = useOpenShift(branchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(startingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid starting cash float.");
      return;
    }

    openShift.mutate(
      { startingCash: amount, notes: notes.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Register shift opened successfully!");
          onOpenChange(false);
          setNotes("");
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to open register shift.");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <LockOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Open Register Shift</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set starting cash float in the drawer to begin taking orders.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="startingCash" className="text-xs font-medium">
              Starting Cash Float
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
              </span>
              <Input
                id="startingCash"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                className="pl-9 text-base font-semibold"
                required
                autoFocus
              />
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Quick:
              </span>
              {QUICK_FLOATS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setStartingCash(val.toString())}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors border ${
                    startingCash === val.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Shift Notes (Optional)
            </Label>
            <Input
              id="notes"
              placeholder="e.g. Morning counter shift, float counted by John"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={openShift.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={openShift.isPending}
            >
              {openShift.isPending ? "Opening Shift..." : "Open Shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
