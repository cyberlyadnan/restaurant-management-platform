"use client";

import { Merge, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOpenOrders } from "@/hooks/use-orders";
import { useMergeTable, type RestaurantTable } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export function MergeTableDialog({
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
  const { data: openOrders } = useOpenOrders(branchId);
  const mergeTable = useMergeTable(branchId);

  // Other non-merged tables that can be joined into this primary table
  const candidateTables = allTables.filter(
    (t) =>
      t.id !== table.id &&
      !t.mergedWithTableId &&
      (t.status === "OCCUPIED" || t.status === "AVAILABLE"),
  );

  const handleMerge = (secondaryTableId: string) => {
    const secondary = allTables.find((t) => t.id === secondaryTableId);

    mergeTable.mutate(
      { secondaryTableId, primaryTableId: table.id },
      {
        onSuccess: () => {
          toast.success(
            `Merged ${secondary?.name ?? `Table ${secondary?.number}`} into ${
              table.name ?? `Table ${table.number}`
            }!`,
          );
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(
            err instanceof ApiError ? err.message : "Could not merge tables",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Merge className="h-5 w-5 text-primary" />
            Merge Tables into {table.name ?? `Table ${table.number}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Push physical tables together for a large dining party. Consolidates seating and active open orders into this primary table.
          </DialogDescription>
        </DialogHeader>

        {candidateTables.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No other eligible tables available to merge right now.
          </p>
        ) : (
          <div className="flex flex-col gap-2 py-2 max-h-64 overflow-y-auto">
            {candidateTables.map((t) => {
              const order = openOrders?.find((o) => o.tableId === t.id);
              return (
                <Button
                  key={t.id}
                  variant="outline"
                  className="h-12 justify-between px-3.5 border-border/70 hover:border-primary hover:bg-primary/5 transition-all"
                  disabled={mergeTable.isPending}
                  onClick={() => handleMerge(t.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {t.name ?? `Table ${t.number}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Users className="h-3 w-3" />
                      {t.capacity}p
                    </span>
                  </div>

                  {order ? (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                      Active: {formatCurrency(order.totalAmount)}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Empty / Ready
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
