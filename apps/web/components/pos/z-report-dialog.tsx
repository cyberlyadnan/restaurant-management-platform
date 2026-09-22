"use client";

import type { ZReportDto } from "@nodedr-restaurant/types";
import { CheckCircle2, DollarSign, FileCheck, Printer, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface ZReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ZReportDto | null;
}

export function ZReportDialog({ open, onOpenChange, report }: ZReportDialogProps) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const isExact = Math.abs(report.cashDifference) < 0.01;
  const isOver = report.cashDifference > 0.01;
  const isShort = report.cashDifference < -0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Z-Report (Shift Closed)</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Final shift reconciliation and closing audit report.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print Z-Report
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Header Card */}
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                {report.branchName}
              </span>
              <span className="rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 px-2 py-0.5 font-semibold text-[10px] uppercase">
                Shift Closed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/40">
              <div>
                <span>Opened By: <strong className="text-foreground font-medium">{report.cashierName}</strong></span>
                <p className="text-[11px]">{formatDateTime(report.openedAt)}</p>
              </div>
              <div>
                <span>Closed By: <strong className="text-foreground font-medium">{report.closedByName}</strong></span>
                <p className="text-[11px]">{formatDateTime(report.closedAt)}</p>
              </div>
            </div>
          </div>

          {/* Variance Banner */}
          <div
            className={`rounded-lg border p-3.5 ${
              isExact
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                : isOver
                ? "bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200"
                : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs uppercase tracking-wide">
                  {isExact ? "Perfect Balance (No Variance)" : isOver ? "Cash Overage" : "Cash Shortage"}
                </span>
                <p className="text-[11px] opacity-80">
                  Actual Count vs Expected Drawer Cash
                </p>
              </div>
              <span
                className={`text-lg font-black ${
                  isExact
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOver
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {report.cashDifference >= 0 ? "+" : ""}
                {formatCurrency(report.cashDifference)}
              </span>
            </div>
          </div>

          {/* Cash Drawer Detailed Reconciliation */}
          <div className="rounded-lg border border-border/80 p-3 space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Cash Drawer Reconciliation
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starting Cash Float:</span>
                <span className="font-medium">{formatCurrency(report.startingCash)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>+ Cash Sales:</span>
                <span>+{formatCurrency(report.tenderBreakdown.cash)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>+ Paid In:</span>
                <span>+{formatCurrency(report.paidIn)}</span>
              </div>
              {report.cashRefunds > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>- Cash Refunds:</span>
                  <span>-{formatCurrency(report.cashRefunds)}</span>
                </div>
              )}
              {report.paidOut > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>- Paid Out / Safe Drop:</span>
                  <span>-{formatCurrency(report.paidOut)}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-1.5 flex justify-between font-bold text-foreground">
                <span>Expected Cash:</span>
                <span>{formatCurrency(report.expectedCashInDrawer)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground">
                <span>Actual Cash Counted:</span>
                <span>{formatCurrency(report.actualCashCounted)}</span>
              </div>
            </div>
          </div>

          {/* Sales Breakdown */}
          <div className="rounded-lg border border-border/80 p-3 space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Sales Summary ({report.orderCount} Orders)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Sales:</span>
                <span className="font-medium">{formatCurrency(report.grossSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net Sales:</span>
                <span className="font-bold">{formatCurrency(report.netSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discounts:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">-{formatCurrency(report.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes:</span>
                <span className="font-medium">{formatCurrency(report.taxAmount)}</span>
              </div>
            </div>
          </div>

          {/* Tender Breakdown */}
          <div className="rounded-lg border border-border/80 p-3 space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Tender Summary
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash:</span>
                <span className="font-medium">{formatCurrency(report.tenderBreakdown.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Card:</span>
                <span className="font-medium">{formatCurrency(report.tenderBreakdown.card)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UPI:</span>
                <span className="font-medium">{formatCurrency(report.tenderBreakdown.upi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other:</span>
                <span className="font-medium">{formatCurrency(report.tenderBreakdown.other)}</span>
              </div>
            </div>
          </div>

          {report.closingNotes && (
            <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
              <span className="font-medium text-muted-foreground text-[11px]">Closing Notes:</span>
              <p className="text-foreground pt-0.5">{report.closingNotes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
