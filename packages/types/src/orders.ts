import { z } from "zod";

export const orderTypeSchema = z.enum([
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "DRIVE_THRU",
  "QR_ORDER",
  "KIOSK",
  "PHONE",
]);
export type OrderTypeDto = z.infer<typeof orderTypeSchema>;

export const kotStatusSchema = z.enum([
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED",
]);
export type KotStatusDto = z.infer<typeof kotStatusSchema>;

export const paymentMethodSchema = z.enum([
  "CASH",
  "CARD",
  "UPI",
  "WALLET",
  "BANK_TRANSFER",
  "GIFT_CARD",
  "STORE_CREDIT",
]);
export type PaymentMethodDto = z.infer<typeof paymentMethodSchema>;

export const cartItemModifierSchema = z.object({
  modifierId: z.string(),
});

export const cartItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive(),
  kitchenNote: z.string().optional(),
  modifierIds: z.array(z.string()).default([]),
});
export type CartItemDto = z.infer<typeof cartItemSchema>;

export const createOrderSchema = z.object({
  type: orderTypeSchema.default("DINE_IN"),
  tableId: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  customerId: z.string().optional(),
  guestName: z.string().trim().min(1).max(60).optional(),
  notes: z.string().optional(),
  items: z.array(cartItemSchema).min(1),
});
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const addOrderItemsSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});
export type AddOrderItemsDto = z.infer<typeof addOrderItemsSchema>;

// Guest self-order from a table's QR code — no account, so a name is the
// only way staff can tell whose order this is (shown on KDS/order lists).
export const publicOrderSchema = z.object({
  guestName: z.string().trim().min(1, "Please enter your name").max(60),
  items: z.array(cartItemSchema).min(1),
});
export type PublicOrderDto = z.infer<typeof publicOrderSchema>;

export const orderStatusSchema = z.enum([
  "OPEN",
  "PARTIALLY_PAID",
  "BILLED",
  "PAID",
  "CANCELLED",
]);
export type OrderStatusDto = z.infer<typeof orderStatusSchema>;

export const paymentEntrySchema = z.object({
  method: paymentMethodSchema,
  amount: z.coerce.number().positive(),
  reference: z.string().optional(),
  payerName: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(255).optional(),
});
export type PaymentEntryDto = z.infer<typeof paymentEntrySchema>;

export const checkoutSchema = z.object({
  customerId: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountFlat: z.coerce.number().min(0).optional(),
  tipAmount: z.coerce.number().min(0).optional(),
  loyaltyPointsToRedeem: z.number().int().min(0).optional(),
  giftCardCode: z.string().optional(),
  splitType: z.enum(["EQUAL", "BY_ITEM", "CUSTOM"]).optional(),
  payments: z.array(paymentEntrySchema).default([]),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;

export const partialPaymentSchema = z.object({
  payment: paymentEntrySchema,
});
export type PartialPaymentDto = z.infer<typeof partialPaymentSchema>;

export interface SplitTicketDto {
  payerName: string;
  itemIds?: string[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalDue: number;
  paymentMethod?: PaymentMethodDto;
  isPaid?: boolean;
}

export interface SplitReceiptDto {
  orderId: string;
  orderNumber: string;
  branchName: string;
  tableNumber?: string;
  payerName?: string;
  splitInfo?: string;
  items?: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
  paymentAmount: number;
  changeAmount?: number;
  paymentDate: string;
  cashierName?: string;
}

export const refundSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().optional(),
  method: paymentMethodSchema,
});
export type RefundDto = z.infer<typeof refundSchema>;

export const mergeOrdersSchema = z.object({
  sourceOrderId: z.string(),
});
export type MergeOrdersDto = z.infer<typeof mergeOrdersSchema>;

export const kotItemStatusUpdateSchema = z.object({
  status: kotStatusSchema,
});
export type KotItemStatusUpdateDto = z.infer<typeof kotItemStatusUpdateSchema>;
