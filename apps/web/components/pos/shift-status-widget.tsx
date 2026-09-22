"use client";

import type { ZReportDto } from "@nodedr-restaurant/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  DollarSign,
  FileText,
  Lock,
  LockOpen,
  User,
  Vault,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCurrentShift } from "@/hooks/use-shifts";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { CashMovementDialog } from "./cash-movement-dialog";
import { CloseShiftDialog } from "./close-shift-dialog";
import { OpenShiftDialog } from "./open-shift-dialog";
import { XReportDialog } from "./x-report-dialog";
import { ZReportDialog } from "./z-report-dialog";

interface ShiftStatusWidgetProps {
  branchId: string | null;
}

export function ShiftStatusWidget({ branchId }: ShiftStatusWidgetProps) {
  const { data: shift, isLoading } = useCurrentShift(branchId);

  const [openShiftOpen, setOpenShiftOpen] = useState(false);
  const [cashMovementOpen, setCashMovementOpen] = useState(false);
  const [xReportOpen, setXReportOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [zReportOpen, setZReportOpen] = useState(false);
  const [latestZReport, setLatestZReport] = useState<ZReportDto | null>(null);

  const handleShiftClosed = (report: ZReportDto) => {
    setLatestZReport(report);
    setZReportOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-12 w-full items-center justify-between rounded-xl border border-border/70 bg-card/60 px-4 py-2 text-xs animate-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-7 w-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/80 backdrop-blur-xs px-4 py-2 shadow-xs transition-all">
        {shift ? (
          /* ACTIVE SHIFT BANNER */
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Status Badge */}
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Register Active
              </div>

              {/* Cashier & Open Time */}
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground border-l border-border/60 pl-3">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <strong className="text-foreground font-medium">{shift.openedByName}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDateTime(shift.openedAt)}</span>
                </span>
              </div>

              {/* Drawer Cash Counter */}
              <div className="flex items-center gap-1.5 border-l border-border/60 pl-3">
                <Vault className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Drawer:</span>
                <strong className="text-foreground font-bold text-sm">
                  {formatCurrency(shift.expectedCash)}
                </strong>
                <span className="text-[11px] text-muted-foreground hidden md:inline">
                  (Float: {formatCurrency(shift.startingCash)})
                </span>
              </div>
            </div>

            {/* Shift Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCashMovementOpen(true)}
                className="h-7 text-xs gap-1 px-2.5"
              >
                <DollarSign className="h-3 w-3" />
                Cash In / Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setXReportOpen(true)}
                className="h-7 text-xs gap-1 px-2.5"
              >
                <FileText className="h-3 w-3" />
                X-Report
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCloseShiftOpen(true)}
                className="h-7 text-xs gap-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Lock className="h-3 w-3" />
                Close Shift
              </Button>
            </div>
          </>
        ) : (
          /* NO ACTIVE SHIFT BANNER */
          <>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Lock className="h-3.5 w-3.5" />
                Register Closed
              </div>
              <span className="text-muted-foreground hidden sm:inline">
                Open a shift with starting float to begin taking orders and tracking drawer cash.
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => setOpenShiftOpen(true)}
              className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <LockOpen className="h-3.5 w-3.5" />
              Open Register Shift
            </Button>
          </>
        )}
      </div>

      {/* Dialog Modals */}
      <OpenShiftDialog
        open={openShiftOpen}
        onOpenChange={setOpenShiftOpen}
        branchId={branchId}
      />

      {shift && (
        <>
          <CashMovementDialog
            open={cashMovementOpen}
            onOpenChange={setCashMovementOpen}
            branchId={branchId}
            shiftId={shift.id}
            currentExpectedCash={shift.expectedCash}
          />
          <XReportDialog
            open={xReportOpen}
            onOpenChange={setXReportOpen}
            branchId={branchId}
            shiftId={shift.id}
          />
          <CloseShiftDialog
            open={closeShiftOpen}
            onOpenChange={setCloseShiftOpen}
            branchId={branchId}
            shiftId={shift.id}
            onShiftClosed={handleShiftClosed}
          />
        </>
      )}

      <ZReportDialog
        open={zReportOpen}
        onOpenChange={setZReportOpen}
        report={latestZReport}
      />
    </>
  );
}
