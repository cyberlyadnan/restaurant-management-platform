"use client";

import type { TableStatusDto } from "@nodedr-restaurant/types";
import {
  CheckCircle2,
  Clock,
  Merge,
  MoreVertical,
  Plus,
  QrCode,
  Receipt,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const STATUS_CONFIG: Record<
  TableStatusDto,
  {
    label: string;
    badgeBg: string;
    borderColor: string;
    glowClass: string;
    dotColor: string;
  }
> = {
  AVAILABLE: {
    label: "Available",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    glowClass: "from-emerald-500/5 to-transparent",
    dotColor: "bg-emerald-500",
  },
  OCCUPIED: {
    label: "Occupied",
    badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    borderColor: "border-rose-500/40 hover:border-rose-500/70",
    glowClass: "from-rose-500/10 to-transparent",
    dotColor: "bg-rose-500 animate-pulse",
  },
  RESERVED: {
    label: "Reserved",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    glowClass: "from-amber-500/5 to-transparent",
    dotColor: "bg-amber-500",
  },
  CLEANING: {
    label: "Cleaning",
    badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    borderColor: "border-indigo-500/30 hover:border-indigo-500/60",
    glowClass: "from-indigo-500/5 to-transparent",
    dotColor: "bg-indigo-500",
  },
  OUT_OF_SERVICE: {
    label: "Out of service",
    badgeBg: "bg-muted text-muted-foreground border-border",
    borderColor: "border-border opacity-60",
    glowClass: "from-muted/20 to-transparent",
    dotColor: "bg-muted-foreground",
  },
};

const ALL_STATUSES: TableStatusDto[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "OUT_OF_SERVICE",
];

export function TableCard({
  table,
  allTables,
  branchId,
}: {
  table: RestaurantTable;
  allTables: RestaurantTable[];
  branchId: string | null;
}) {
  const router = useRouter();
  const updateStatus = useUpdateTableStatus(branchId);
  const [qrOpen, setQrOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const config = STATUS_CONFIG[table.status];

  return (
    <>
      <Card
        className={cn(
          "group relative flex flex-col justify-between rounded-2xl border-2 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden bg-card min-w-0",
          config.borderColor,
        )}
      >
        {/* Subtle radial ambient background glow */}
        <div
          className={cn(
            "absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-50 blur-xl pointer-events-none transition-opacity group-hover:opacity-80",
            config.glowClass,
          )}
        />

        {/* Card Body */}
        <div className="flex flex-col gap-3 relative z-10 min-w-0">
          {/* Row 1: Shape Icon, Table Name, Status Badge & Dropdown */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border p-1.5 transition-colors",
                  table.status === "OCCUPIED"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : table.status === "AVAILABLE"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-secondary border-border text-foreground",
                )}
              >
                <TableShapeIcon
                  shape={table.shape}
                  capacity={table.capacity}
                  className="h-full w-full"
                />
              </div>

              <span className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
                {table.name ?? `Table ${table.number}`}
              </span>
            </div>

            {/* Status Badge + More Menu */}
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 px-2 py-0.5 text-[11px] font-bold border shadow-2xs whitespace-nowrap",
                  config.badgeBg,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
                {config.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Set Table Status
                  </div>
                  {ALL_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={status === table.status}
                      onClick={() => updateStatus.mutate({ id: table.id, status })}
                      className="text-xs"
                    >
                      <span
                        className={cn(
                          "mr-2 h-2 w-2 rounded-full",
                          STATUS_CONFIG[status].dotColor,
                        )}
                      />
                      {STATUS_CONFIG[status].label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setQrOpen(true)} className="text-xs">
                    <QrCode className="mr-2 h-3.5 w-3.5" />
                    Table QR Code
                  </DropdownMenuItem>
                  {table.status === "OCCUPIED" && (
                    <DropdownMenuItem onClick={() => setMergeOpen(true)} className="text-xs">
                      <Merge className="mr-2 h-3.5 w-3.5" />
                      Merge with table
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Row 2: Capacity & Shape Info Tags */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold bg-muted/60 text-foreground px-2 py-0.5 rounded-md text-[11px]">
              <Users className="h-3 w-3 text-muted-foreground" />
              {table.capacity} Guests
            </span>
            <span className="inline-flex items-center bg-muted/40 text-muted-foreground font-medium px-2 py-0.5 rounded-md text-[11px] capitalize">
              {table.shape} Table
            </span>
          </div>

          {/* Row 3: Dynamic Table Status Pill */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-xs border border-border/40">
            {table.status === "OCCUPIED" ? (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <ElapsedTimer since={table.statusSince} />
                </span>
                <span className="text-[11px] font-bold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider">
                  Active Dining
                </span>
              </div>
            ) : table.status === "RESERVED" ? (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Reserved
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">Arrival pending</span>
              </div>
            ) : table.status === "CLEANING" ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  Needs Reset
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">Turnaround</span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Ready to seat
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">Max {table.capacity}p</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Action Buttons (Never Truncated, Clean Spacing) */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-border/40 relative z-10">
          {table.status === "AVAILABLE" && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-9 shadow-xs min-w-0"
                onClick={() => router.push(`/pos?tableId=${table.id}`)}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Start Order</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground border-border/80"
                onClick={() => setQrOpen(true)}
                title="View Table QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </>
          )}

          {table.status === "OCCUPIED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-w-0 gap-1 text-xs font-semibold h-9 px-2 border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                onClick={() => router.push(`/pos?tableId=${table.id}`)}
              >
                <Utensils className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Add Round</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 min-w-0 gap-1 text-xs font-bold h-9 px-2 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                onClick={() => setBillOpen(true)}
              >
                <Receipt className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Bill Table</span>
              </Button>
            </>
          )}

          {table.status === "RESERVED" && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 min-w-0 gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white h-9 shadow-xs"
                onClick={() => updateStatus.mutate({ id: table.id, status: "OCCUPIED" })}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Seat Guests</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs text-muted-foreground shrink-0"
                onClick={() => updateStatus.mutate({ id: table.id, status: "AVAILABLE" })}
              >
                Release
              </Button>
            </>
          )}

          {table.status === "CLEANING" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-9"
              onClick={() => updateStatus.mutate({ id: table.id, status: "AVAILABLE" })}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Clean & Ready
            </Button>
          )}

          {table.status === "OUT_OF_SERVICE" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-9 text-muted-foreground font-semibold"
              onClick={() => updateStatus.mutate({ id: table.id, status: "AVAILABLE" })}
            >
              Restore to Service
            </Button>
          )}
        </div>
      </Card>

      <TableQrDialog table={table} branchId={branchId} open={qrOpen} onOpenChange={setQrOpen} />
      <MergeTableDialog
        branchId={branchId}
        table={table}
        allTables={allTables}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
      />
      <BillTableDialog
        branchId={branchId}
        table={table}
        open={billOpen}
        onOpenChange={setBillOpen}
      />
    </>
  );
}
