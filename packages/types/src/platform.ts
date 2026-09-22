import { z } from "zod";

export const PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "PLATFORM_SUPPORT",
  "PLATFORM_FINANCE",
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const platformLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type PlatformLoginDto = z.infer<typeof platformLoginSchema>;

export interface PlatformSessionUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
}

export const planFeaturesList = [
  "pos",
  "kds",
  "tables",
  "menu",
  "reports",
  "receipt_print",
  "inventory",
  "recipes",
  "crm",
  "loyalty",
  "reservations",
  "waitlist",
  "analytics",
  "procurement",
  "multi_branch",
  "api_access",
  "audit_log",
  "backup",
  "custom_roles",
] as const;
export type PlanFeatureKey = (typeof planFeaturesList)[number];

export const createPlanSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  monthlyPrice: z.number().nonnegative(),
  quarterlyPrice: z.number().nonnegative().optional(),
  halfYearlyPrice: z.number().nonnegative().optional(),
  yearlyPrice: z.number().nonnegative(),
  currency: z.string().default("INR"),
  trialDays: z.number().int().min(0).default(14),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  maxBranches: z.number().int().min(1).default(1),
  maxUsers: z.number().int().min(1).default(5),
  maxTables: z.number().int().min(1).default(20),
  maxProducts: z.number().int().min(1).default(100),
  features: z.array(z.string()).default([]),
});
export type CreatePlanDto = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();
export type UpdatePlanDto = z.infer<typeof updatePlanSchema>;

export interface PlanDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  monthlyPrice: number;
  quarterlyPrice?: number | null;
  halfYearlyPrice?: number | null;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  maxBranches: number;
  maxUsers: number;
  maxTables: number;
  maxProducts: number;
  features: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    subscriptions?: number;
  };
}

export const SUBSCRIPTION_STATUSES = [
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "EXPIRED",
  "SUSPENDED",
  "CANCELLED",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_PERIODS = [
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "YEARLY",
  "CUSTOM",
] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const activateSubscriptionSchema = z.object({
  planId: z.string().min(1),
  billingPeriod: z.enum(BILLING_PERIODS).default("MONTHLY"),
  amount: z.number().nonnegative(),
  currency: z.string().default("INR"),
  startDate: z.string().optional(),
  endDate: z.string(),
  notes: z.string().optional(),
  isAutoRenew: z.boolean().default(false),
  recordPayment: z.boolean().default(true),
  paymentMethod: z
    .enum([
      "MANUAL_CASH",
      "MANUAL_BANK_TRANSFER",
      "MANUAL_UPI",
      "MANUAL_CHEQUE",
      "RAZORPAY",
      "STRIPE",
    ])
    .default("MANUAL_BANK_TRANSFER"),
  paymentReference: z.string().optional(),
});
export type ActivateSubscriptionDto = z.infer<typeof activateSubscriptionSchema>;

export const SUBSCRIPTION_PAYMENT_METHODS = [
  "MANUAL_CASH",
  "MANUAL_BANK_TRANSFER",
  "MANUAL_UPI",
  "MANUAL_CHEQUE",
  "RAZORPAY",
  "STRIPE",
] as const;
export type SubscriptionPaymentMethod = (typeof SUBSCRIPTION_PAYMENT_METHODS)[number];

export const recordPaymentSchema = z.object({
  subscriptionId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  method: z.enum(SUBSCRIPTION_PAYMENT_METHODS),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
});
export type RecordPaymentDto = z.infer<typeof recordPaymentSchema>;

export const RESTAURANT_STATUSES = [
  "ACTIVE",
  "TRIAL",
  "SUSPENDED",
  "EXPIRED",
  "PENDING_APPROVAL",
] as const;
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];

export const createRestaurantEnrollmentSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().optional(),
  initialPassword: z.string().min(6).default("Password123!"),
  branchName: z.string().min(2).default("Main Branch"),
  planId: z.string().min(1),
  billingPeriod: z.enum(BILLING_PERIODS).default("MONTHLY"),
  amount: z.number().nonnegative().optional(),
  status: z.enum(RESTAURANT_STATUSES).default("ACTIVE"),
  notes: z.string().optional(),
});
export type CreateRestaurantEnrollmentDto = z.infer<
  typeof createRestaurantEnrollmentSchema
>;

export const updateRestaurantStatusSchema = z.object({
  status: z.enum(RESTAURANT_STATUSES),
  notes: z.string().optional(),
});
export type UpdateRestaurantStatusDto = z.infer<
  typeof updateRestaurantStatusSchema
>;

export const publicRegisterSchema = z.object({
  restaurantName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  planSlug: z.string().default("starter"),
  branchName: z.string().min(2).default("Main Branch"),
});
export type PublicRegisterDto = z.infer<typeof publicRegisterSchema>;

export interface PlatformDashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  trialRestaurants: number;
  expiredRestaurants: number;
  suspendedRestaurants: number;
  pendingRestaurants: number;
  monthlyRecurringRevenue: number;
  totalRevenue: number;
  activeSubscriptions: number;
  expiringIn7Days: number;
  planDistribution: {
    planName: string;
    count: number;
  }[];
  recentRestaurants: {
    id: string;
    name: string;
    ownerName: string | null;
    ownerEmail: string | null;
    status: RestaurantStatus;
    planName: string | null;
    createdAt: string;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export interface SubscriptionInvoiceDto {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  restaurantId: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: "DRAFT" | "ISSUED" | "PAID" | "VOID" | "CANCELLED";
  periodStart: string | Date;
  periodEnd: string | Date;
  dueDate: string | Date;
  paidAt?: string | Date | null;
  items?: unknown;
  notes?: string | null;
  createdAt: string | Date;
}

export interface SubscriptionPaymentDto {
  id: string;
  restaurantId: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  method: SubscriptionPaymentMethod;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  reference?: string | null;
  notes?: string | null;
  createdAt: string | Date;
}

export const restaurantUpgradeSchema = z.object({
  planSlug: z.string(),
  billingPeriod: z.enum(BILLING_PERIODS).default("MONTHLY"),
});
export type RestaurantUpgradeDto = z.infer<typeof restaurantUpgradeSchema>;

export interface RestaurantBillingOverview {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    planName: string;
    planSlug: string;
    billingPeriod: BillingPeriod;
    startDate: string;
    endDate: string;
    trialEndsAt: string | null;
    daysRemaining: number;
    isTrial: boolean;
    isAutoRenew: boolean;
  } | null;
  plan: PlanDto | null;
  usage: {
    branches: number;
    users: number;
    tables: number;
    products: number;
  };
  limits: {
    maxBranches: number;
    maxUsers: number;
    maxTables: number;
    maxProducts: number;
  };
  features: string[];
  invoices: SubscriptionInvoiceDto[];
  payments: SubscriptionPaymentDto[];
  availablePlans: PlanDto[];
}


