"use client";

import { CheckCircle2, Clock, FileText, Printer, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useXReport } from "@/hooks/use-shifts";
import { formatCurrency, formatDateTime } from "@/lib/format";

interface XReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  shiftId: string | null;
}

export function XReportDialog({ open, onOpenChange, branchId, shiftId }: XReportDialogProps) {
  const { data: report, isLoading } = useXReport(branchId, shiftId, open);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">X-Report (Mid-Shift Summary)</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Read-only active register audit without closing the shift.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : !report ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No shift data available.
          </div>
        ) : (
          <div className="space-y-4 pt-1 text-xs">
            {/* Metadata Header */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  {report.branchName}
                </span>
                <span className="rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 px-2 py-0.5 font-semibold text-[10px] uppercase">
                  Active Shift
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t border-border/40">
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>Cashier: <strong className="text-foreground font-medium">{report.cashierName}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Opened: <strong className="text-foreground font-medium">{formatDateTime(report.openedAt)}</strong></span>
                </div>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="rounded-lg border border-border/80 p-3 space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Sales Overview ({report.orderCount} Orders)
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Sales:</span>
                  <span className="font-medium">{formatCurrency(report.grossSales)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Discounts Applied:</span>
                  <span>-{formatCurrency(report.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax Amount:</span>
                  <span>{formatCurrency(report.taxAmount)}</span>
                </div>
                <div className="border-t border-border/60 pt-1 flex justify-between font-bold text-sm text-foreground">
                  <span>Net Sales:</span>
                  <span>{formatCurrency(report.netSales)}</span>
                </div>
              </div>
            </div>

            {/* Tender Breakdown */}
            <div className="rounded-lg border border-border/80 p-3 space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Tender Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
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

            {/* Cash Drawer Reconciliation */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3.5 space-y-2">
              <h4 className="font-bold text-primary text-xs uppercase tracking-wider">
                Cash Drawer Balance
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Opening Cash Float:</span>
                  <span className="font-medium text-foreground">{formatCurrency(report.startingCash)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>+ Cash Sales:</span>
                  <span className="font-medium">+{formatCurrency(report.tenderBreakdown.cash)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>+ Paid In (Movements):</span>
                  <span className="font-medium">+{formatCurrency(report.paidIn)}</span>
                </div>
                {report.cashRefunds > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>- Cash Refunds:</span>
                    <span className="font-medium">-{formatCurrency(report.cashRefunds)}</span>
                  </div>
                )}
                {report.paidOut > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>- Paid Out / Safe Drop:</span>
                    <span className="font-medium">-{formatCurrency(report.paidOut)}</span>
                  </div>
                )}
                <div className="border-t border-primary/20 pt-2 flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">Expected Cash in Drawer:</span>
                  <span className="font-extrabold text-base text-primary">
                    {formatCurrency(report.expectedCashInDrawer)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
