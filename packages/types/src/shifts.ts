import { z } from "zod";

export const shiftStatusSchema = z.enum(["OPEN", "CLOSED"]);
export type ShiftStatusDto = z.infer<typeof shiftStatusSchema>;

export const cashMovementTypeSchema = z.enum(["PAID_IN", "PAID_OUT", "DROP"]);
export type CashMovementTypeDto = z.infer<typeof cashMovementTypeSchema>;

export const openShiftSchema = z.object({
  startingCash: z.coerce.number().min(0, "Starting cash float cannot be negative"),
  notes: z.string().trim().max(500).optional(),
});
export type OpenShiftDto = z.infer<typeof openShiftSchema>;

export const cashMovementSchema = z.object({
  type: cashMovementTypeSchema,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  reason: z.string().trim().min(2, "Reason must be at least 2 characters").max(255),
});
export type CashMovementDto = z.infer<typeof cashMovementSchema>;

export const closeShiftSchema = z.object({
  actualCash: z.coerce.number().min(0, "Actual cash counted cannot be negative"),
  notes: z.string().trim().max(500).optional(),
});
export type CloseShiftDto = z.infer<typeof closeShiftSchema>;

export interface ShiftCashMovementDto {
  id: string;
  shiftId: string;
  type: CashMovementTypeDto;
  amount: number;
  reason: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
}

export interface RegisterShiftDto {
  id: string;
  branchId: string;
  openedById: string;
  openedByName?: string;
  closedById?: string | null;
  closedByName?: string | null;
  openedAt: string;
  closedAt?: string | null;
  status: ShiftStatusDto;
  startingCash: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  otherSales: number;
  cashRefunds: number;
  cardRefunds: number;
  paidIn: number;
  paidOut: number;
  expectedCash: number;
  actualCash?: number | null;
  cashDifference?: number | null;
  notes?: string | null;
  movements?: ShiftCashMovementDto[];
}

export interface XReportDto {
  reportType?: 'X_REPORT';
  shiftId: string;
  branchId: string;
  branchName: string;
  openedAt: string;
  generatedAt: string;
  cashierName: string;
  startingCash: number;
  grossSales: number;
  netSales: number;
  taxAmount: number;
  discountAmount: number;
  orderCount: number;
  tenderBreakdown: {
    cash: number;
    card: number;
    upi: number;
    wallet: number;
    other: number;
  };
  paidIn: number;
  paidOut: number;
  cashRefunds: number;
  expectedCashInDrawer: number;
  movements: ShiftCashMovementDto[];
}

export interface ZReportDto extends Omit<XReportDto, 'reportType'> {
  reportType: 'Z_REPORT';
  closedAt: string;
  closedByName: string;
  actualCashCounted: number;
  cashDifference: number; // actualCash - expectedCash (Over / Short)
  closingNotes?: string | null;
}
