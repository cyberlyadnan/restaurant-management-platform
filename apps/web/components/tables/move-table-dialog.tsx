"use client";

import { ArrowRightLeft, Check, MoveRight, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMoveTable, type RestaurantTable } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";

export function MoveTableDialog({
  branchId,
  table,
  allTables,
  open,
  onOpenChange,
}: {
  branchId: string | null;
  table: RestaurantTable;
  allTables: RestaurantTable[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const moveTable = useMoveTable(branchId);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // Available target tables (must be AVAILABLE and not current table)
  const availableTargetTables = allTables.filter(
    (t) => t.id !== table.id && t.status === "AVAILABLE",
  );

  const handleMove = () => {
    if (!selectedTargetId) {
      toast.error("Please select a target table to move to");
      return;
    }

    const targetTable = allTables.find((t) => t.id === selectedTargetId);

    moveTable.mutate(
      { sourceTableId: table.id, targetTableId: selectedTargetId },
      {
        onSuccess: (res) => {
          toast.success(
            `Successfully moved ${table.name ?? `Table ${table.number}`} to ${
              targetTable?.name ?? `Table ${targetTable?.number}`
            }!`,
          );
          onOpenChange(false);
          setSelectedTargetId(null);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not move table"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Move / Transfer {table.name ?? `Table ${table.number}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select an available table to relocate this dining party and transfer open orders.
          </DialogDescription>
        </DialogHeader>

        {availableTargetTables.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No empty tables available to relocate guests. Clear or unmerge a table first.
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {availableTargetTables.map((t) => {
                const isSelected = selectedTargetId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTargetId(t.id)}
                    className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold text-sm text-foreground">
                        {t.name ?? `Table ${t.number}`}
                      </span>
                      {isSelected && (
                        <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground stroke-[3]" />
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Users className="h-3.5 w-3.5" />
                      <span>Capacity: {t.capacity} guests</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-10 font-bold text-xs gap-2 bg-primary text-primary-foreground shadow-xs"
              disabled={!selectedTargetId || moveTable.isPending}
              onClick={handleMove}
            >
              {moveTable.isPending ? (
                "Transferring Table..."
              ) : (
                <>
                  <span>Complete Relocation</span>
                  <MoveRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
