"use client";

import type { TableStatusDto } from "@nodedr-restaurant/types";
import { ClipboardList, Merge, Plus, QrCode, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateTableStatus, type RestaurantTable } from "@/hooks/use-tables";
import { cn } from "@/lib/utils";
import { BillTableDialog } from "./bill-table-dialog";
import { ElapsedTimer } from "./elapsed-timer";
import { MergeTableDialog } from "./merge-table-dialog";
import { TableQrDialog } from "./table-qr-dialog";
import { TableShapeIcon } from "./table-shape-icon";

const STATUS_STYLES: Record<TableStatusDto, string> = {
  AVAILABLE:
    "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/80 shadow-xs hover:shadow-emerald-500/10",
  OCCUPIED:
    "bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 hover:border-rose-500/80 shadow-xs hover:shadow-rose-500/10",
  RESERVED:
    "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:border-amber-500/80 shadow-xs hover:shadow-amber-500/10",
  CLEANING:
    "bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500/80 shadow-xs",
  OUT_OF_SERVICE:
    "bg-muted border-border text-muted-foreground opacity-60",
};

const STATUS_LABEL: Record<TableStatusDto, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  CLEANING: "Cleaning",
  OUT_OF_SERVICE: "Out of service",
};

export function TableTile({
  table,
  allTables,
  branchId,
  style,
}: {
  table: RestaurantTable;
  allTables: RestaurantTable[];
  branchId: string | null;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const updateStatus = useUpdateTableStatus(branchId);
  const [qrOpen, setQrOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          style={style}
          className={cn(
            "absolute flex flex-col items-center justify-center gap-1 rounded-2xl border-2 text-xs font-semibold shadow-xs transition-all duration-200 hover:scale-[1.04] hover:shadow-md cursor-pointer select-none backdrop-blur-xs",
            STATUS_STYLES[table.status],
          )}
        >
          {table.status === "OCCUPIED" && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          )}
          <TableShapeIcon shape={table.shape} capacity={table.capacity} className="h-6 w-6 transition-transform group-hover:scale-110" />
          <span className="text-sm font-bold tracking-tight">{table.name ?? `T${table.number}`}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium opacity-85">
            <Users className="h-3 w-3" />
            {table.capacity}p
          </span>
          {(table.status === "OCCUPIED" || table.status === "RESERVED") && (
            <ElapsedTimer since={table.statusSince} className="flex items-center gap-1 text-[10px] font-bold opacity-90" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {STATUS_LABEL[table.status]} · {table.capacity} guests
          </div>
          {(Object.keys(STATUS_LABEL) as TableStatusDto[]).map((status) => (
            <DropdownMenuItem
              key={status}
              disabled={status === table.status}
              onClick={() => updateStatus.mutate({ id: table.id, status })}
            >
              {STATUS_LABEL[status]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setQrOpen(true)}>
            <QrCode className="h-4 w-4" />
            View QR code
          </DropdownMenuItem>
          {(table.status === "AVAILABLE" || table.status === "RESERVED") && (
            <DropdownMenuItem onClick={() => router.push(`/pos?tableId=${table.id}`)}>
              <Plus className="h-4 w-4" />
              New order
            </DropdownMenuItem>
          )}
          {table.status === "OCCUPIED" && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/pos?tableId=${table.id}`)}>
                <Plus className="h-4 w-4" />
                Add another round
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillOpen(true)}>
                <ClipboardList className="h-4 w-4" />
                Bill this table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMergeOpen(true)}>
                <Merge className="h-4 w-4" />
                Merge another table&apos;s bill here
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TableQrDialog table={table} branchId={branchId} open={qrOpen} onOpenChange={setQrOpen} />
      <MergeTableDialog
        branchId={branchId}
        table={table}
        allTables={allTables}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />
      <BillTableDialog branchId={branchId} table={table} open={billOpen} onOpenChange={setBillOpen} />
    </>
  );
}
