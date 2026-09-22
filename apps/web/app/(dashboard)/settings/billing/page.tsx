"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Download,
  FileText,
  Layers,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRestaurantBilling, useUpgradePlan } from "@/hooks/use-restaurant-billing";
import type { BillingPeriod, SubscriptionInvoiceDto } from "@nodedr-restaurant/types";

export default function RestaurantBillingPage() {
  const { data: billing, isLoading, error, refetch } = useRestaurantBilling();
  const upgradeMutation = useUpgradePlan();

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<SubscriptionInvoiceDto | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="h-44 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Failed to load billing information</h2>
        <p className="text-slate-400 text-sm">Please verify your restaurant session and try again.</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const { subscription, plan, usage, limits, features, invoices, availablePlans } = billing;

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanForUpgrade) return;
    try {
      await upgradeMutation.mutateAsync({
        planSlug: selectedPlanForUpgrade,
        billingPeriod,
      });
      setSelectedPlanForUpgrade(null);
      setSuccessMsg("Subscription plan upgraded successfully!");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to upgrade plan. Please try again.");
    }
  };

  const calculateUsagePercent = (used: number, max: number) => {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-rose-500";
    if (percent >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const targetPlanDetails = availablePlans.find((p) => p.slug === selectedPlanForUpgrade);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Link href="/settings" className="hover:underline text-slate-400">
              Settings
            </Link>{" "}
            / <span>Subscription & Billing</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Restaurant Subscription & Quotas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your operational tier, track active resource utilization, and review SaaS invoices.
          </p>
        </div>

        {subscription?.isTrial && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
            <Clock className="h-4 w-4" />
            <span>{subscription.daysRemaining} days left in free trial</span>
          </div>
        )}
      </div>

      <SettingsTabs />

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Subscription Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 font-bold uppercase tracking-wider ${
                  subscription?.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : subscription?.status === "TRIAL"
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {subscription?.status ?? "NO ACTIVE PLAN"}
              </Badge>
              {subscription?.billingPeriod && (
                <span className="text-xs text-slate-400 font-medium">
                  Billed {subscription.billingPeriod.toLowerCase()}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {plan?.name ?? "Starter"} Plan
              </h2>
              {plan && (
                <span className="text-slate-400 text-sm">
                  ₹{plan.monthlyPrice.toLocaleString()}/mo
                </span>
              )}
            </div>

            <p className="text-slate-400 text-sm max-w-xl">
              {plan?.description ??
                "Essential cloud POS, floor & kitchen workflows for single or growing restaurants."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {subscription?.endDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    Renewal date:{" "}
                    <strong className="text-slate-200">
                      {new Date(subscription.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
              )}
              {subscription?.isTrial && (
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Free trial active — upgrade to keep uninterrupted access</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={() => {
                const popular = availablePlans.find((p) => p.isPopular);
                setSelectedPlanForUpgrade(popular ? popular.slug : availablePlans[0]?.slug ?? "professional");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-950/50"
            >
              <Crown className="h-4 w-4 mr-2 text-amber-300" />
              {subscription?.isTrial ? "Upgrade to Keep Plan" : "Change Subscription Tier"}
            </Button>
          </div>
        </div>
      </div>

      {/* Quotas & Resource Utilization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-400" />
            Operational Resource Quotas
          </h2>
          <span className="text-xs text-slate-400">
            Real-time capacity tracking vs your {plan?.name ?? "Starter"} plan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Branches */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Active Outlets
              </span>
              <span className="text-xs font-bold text-slate-300">
                {calculateUsagePercent(usage.branches, limits.maxBranches)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{usage.branches}</span>
              <span className="text-xs text-slate-500">of {limits.maxBranches} max</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(
                  calculateUsagePercent(usage.branches, limits.maxBranches),
                )}`}
                style={{ width: `${calculateUsagePercent(usage.branches, limits.maxBranches)}%` }}
              />
            </div>
          </div>

          {/* Staff Users */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-sky-400" />
                Staff Accounts
              </span>
              <span className="text-xs font-bold text-slate-300">
                {calculateUsagePercent(usage.users, limits.maxUsers)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{usage.users}</span>
              <span className="text-xs text-slate-500">of {limits.maxUsers} max</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(
                  calculateUsagePercent(usage.users, limits.maxUsers),
                )}`}
                style={{ width: `${calculateUsagePercent(usage.users, limits.maxUsers)}%` }}
              />
            </div>
          </div>

          {/* Tables */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-400" />
                Dining Tables
              </span>
              <span className="text-xs font-bold text-slate-300">
                {calculateUsagePercent(usage.tables, limits.maxTables)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{usage.tables}</span>
              <span className="text-xs text-slate-500">of {limits.maxTables} max</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(
                  calculateUsagePercent(usage.tables, limits.maxTables),
                )}`}
                style={{ width: `${calculateUsagePercent(usage.tables, limits.maxTables)}%` }}
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <UtensilsCrossed className="h-4 w-4 text-purple-400" />
                Menu Items
              </span>
              <span className="text-xs font-bold text-slate-300">
                {calculateUsagePercent(usage.products, limits.maxProducts)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{usage.products}</span>
              <span className="text-xs text-slate-500">of {limits.maxProducts} max</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getProgressColor(
                  calculateUsagePercent(usage.products, limits.maxProducts),
                )}`}
                style={{ width: `${calculateUsagePercent(usage.products, limits.maxProducts)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Entitlements Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Included Plan Capabilities
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { key: "pos", label: "Cloud POS & Cashier" },
            { key: "kds", label: "Kitchen Display (KDS)" },
            { key: "tables", label: "Table & Floor Grid" },
            { key: "menu", label: "Menu & Categories" },
            { key: "reports", label: "Analytics & Reports" },
            { key: "receipt_print", label: "Thermal Receipt Print" },
            { key: "inventory", label: "Store Inventory & WAC" },
            { key: "recipes", label: "Recipe Costing" },
            { key: "crm", label: "Customer CRM & Loyalty" },
            { key: "reservations", label: "Table Reservations" },
            { key: "multi_branch", label: "Central Multi-Branch" },
            { key: "api_access", label: "REST / Webhook API" },
          ].map((item) => {
            const isUnlocked = features.includes(item.key) || features.includes("*") || plan?.slug === "enterprise";
            return (
              <div
                key={item.key}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-colors ${
                  isUnlocked
                    ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300"
                    : "bg-slate-900/30 border-slate-800/60 text-slate-500 line-through opacity-60"
                }`}
              >
                {isUnlocked ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-slate-600 flex-shrink-0" />
                )}
                <span className="font-medium truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Plans Upgrade Matrix */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Available Subscription Plans</h2>
            <p className="text-slate-400 text-sm">
              Upgrade instantly or switch billing cycle to save with annual commitments.
            </p>
          </div>

          {/* Billing period toggle */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start">
            <button
              onClick={() => setBillingPeriod("MONTHLY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingPeriod === "MONTHLY"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("YEARLY")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingPeriod === "YEARLY"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Yearly
              <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((p) => {
            const isCurrent = plan?.slug === p.slug;
            const price = billingPeriod === "YEARLY" ? p.yearlyPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "bg-slate-900 border-emerald-500/40 ring-1 ring-emerald-500/30"
                    : p.isPopular
                    ? "bg-slate-900/80 border-indigo-500/30 shadow-lg shadow-indigo-950/20"
                    : "bg-slate-900/40 border-slate-800"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white">{p.name}</span>
                    {isCurrent ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Active Plan
                      </Badge>
                    ) : p.isPopular ? (
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                        Recommended
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2">{p.description}</p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{price.toLocaleString()}</span>
                      <span className="text-xs text-slate-500">
                        /{billingPeriod === "YEARLY" ? "year" : "month"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Max Outlets:</span>
                      <span className="font-semibold">{p.maxBranches}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Staff Accounts:</span>
                      <span className="font-semibold">{p.maxUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Dining Tables:</span>
                      <span className="font-semibold">{p.maxTables}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Menu Items:</span>
                      <span className="font-semibold">{p.maxProducts}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-slate-800 text-slate-400 text-xs">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setSelectedPlanForUpgrade(p.slug)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
                    >
                      Switch to {p.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SaaS Invoices & Payment Ledger */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Billing Invoices & Receipts
          </h2>
          <span className="text-xs text-slate-500">Generated automatically for each billing cycle</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="pb-3">Invoice Number</th>
                  <th className="pb-3">Billing Period</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Issue Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/20 text-slate-300 transition-colors">
                    <td className="py-3.5 font-mono font-medium text-emerald-400 text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {new Date(inv.periodStart).toLocaleDateString()} –{" "}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 font-bold text-white text-xs">
                      ₹{inv.total.toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveInvoice(inv)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 h-8 px-2.5"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" /> View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Upgrade Confirmation Dialog */}
      <Dialog
        open={Boolean(selectedPlanForUpgrade)}
        onOpenChange={(open) => {
          if (!open) setSelectedPlanForUpgrade(null);
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-300" />
              Confirm Subscription Change
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Review your new operational quota and billing terms before activating.
            </DialogDescription>
          </DialogHeader>

          {targetPlanDetails && (
            <div className="space-y-4 py-3 text-sm">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Target Plan</span>
                  <span className="font-bold text-white text-base">{targetPlanDetails.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Billing Cycle</span>
                  <span className="font-medium text-slate-300">{billingPeriod}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">Amount Due</span>
                  <span className="font-extrabold text-emerald-400 text-lg">
                    ₹
                    {(billingPeriod === "YEARLY"
                      ? targetPlanDetails.yearlyPrice
                      : targetPlanDetails.monthlyPrice
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Up to {targetPlanDetails.maxBranches} outlet branches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Up to {targetPlanDetails.maxUsers} staff member accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Up to {targetPlanDetails.maxTables} dining tables</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Up to {targetPlanDetails.maxProducts} menu products</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSelectedPlanForUpgrade(null)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              disabled={upgradeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
            >
              {upgradeMutation.isPending ? "Activating..." : "Confirm & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Printable Receipt Modal */}
      <Dialog open={Boolean(activeInvoice)} onOpenChange={(open) => !open && setActiveInvoice(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>SaaS Subscription Invoice</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="text-xs border-slate-700 text-slate-300"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          {activeInvoice && (
            <div className="space-y-6 py-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-sm">OrderRestro SaaS Platform</h3>
                    <p className="text-slate-400 text-[11px]">Cloud Restaurant Operating System</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                  >
                    {activeInvoice.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-slate-400">
                  <div>
                    <span>Invoice #: </span>
                    <strong className="text-white">{activeInvoice.invoiceNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span>Date: </span>
                    <strong className="text-white">
                      {new Date(activeInvoice.createdAt).toLocaleDateString()}
                    </strong>
                  </div>
                  <div>
                    <span>Period: </span>
                    <span className="text-white">
                      {new Date(activeInvoice.periodStart).toLocaleDateString()} –{" "}
                      {new Date(activeInvoice.periodEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Subscription Fee</span>
                    <span>₹{activeInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax (GST)</span>
                    <span>₹{activeInvoice.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total</span>
                    <span className="text-emerald-400">₹{activeInvoice.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
