"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Layers,
  Plus,
  Receipt,
  ShieldAlert,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActivateSubscription,
  usePlatformPlans,
  usePlatformRestaurant,
  useUpdateRestaurantStatus,
} from "@/hooks/use-platform";

export default function PlatformRestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const { data, isLoading, isError } = usePlatformRestaurant(id);
  const { data: plans } = usePlatformPlans();
  const updateStatusMutation = useUpdateRestaurantStatus();
  const activateSubMutation = useActivateSubscription();

  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedBilling, setSelectedBilling] = useState<
    "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY"
  >("YEARLY");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [durationMonths, setDurationMonths] = useState(12);
  const [paymentMethod, setPaymentMethod] = useState<
    "MANUAL_BANK_TRANSFER" | "MANUAL_CASH" | "MANUAL_UPI" | "MANUAL_CHEQUE"
  >("MANUAL_BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [subNotes, setSubNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Loading Tenant Details...</span>
        </div>
      </div>
    );
  }

  if (isError || !data?.restaurant) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
        Restaurant not found or error loading tenant.
      </div>
    );
  }

  const r = data.restaurant;
  const metrics = data.metrics;
  const activeSub = r.subscriptions?.find((s: any) =>
    ["ACTIVE", "TRIAL"].includes(s.status),
  );

  const handleStatusChange = async (newStatus: any) => {
    if (confirm(`Are you sure you want to set this restaurant to ${newStatus}?`)) {
      await updateStatusMutation.mutateAsync({
        id: r.id,
        dto: { status: newStatus },
      });
    }
  };

  const handleOpenActivate = () => {
    const defaultPlan = activeSub?.plan ?? plans?.[0];
    if (defaultPlan) {
      setSelectedPlanId(defaultPlan.id);
      setCustomAmount(Number(defaultPlan.yearlyPrice));
    }
    setModalError(null);
    setActivateModalOpen(true);
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + Number(durationMonths));

    const plan = plans?.find((p) => p.id === selectedPlanId);
    const amount =
      typeof customAmount === "number"
        ? customAmount
        : selectedBilling === "YEARLY"
          ? Number(plan?.yearlyPrice ?? 0)
          : Number(plan?.monthlyPrice ?? 0);

    try {
      await activateSubMutation.mutateAsync({
        id: r.id,
        dto: {
          planId: selectedPlanId,
          billingPeriod: selectedBilling,
          amount,
          endDate: endDate.toISOString(),
          currency: r.currency || "INR",
          recordPayment: true,
          paymentMethod,
          paymentReference: paymentRef || undefined,
          notes: subNotes || undefined,
          isAutoRenew: false,
        },
      });
      setActivateModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || "Failed to activate subscription.");
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    TRIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    EXPIRED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
    PENDING_APPROVAL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Back */}
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants
      </Link>

      {/* Header Profile Card */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {r.name}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                statusColors[r.status] || "bg-slate-800 text-slate-300"
              }`}
            >
              {r.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>Owner: {r.ownerName ?? "—"}</span>
            <span>•</span>
            <span>Email: {r.ownerEmail ?? "—"}</span>
            <span>•</span>
            <span>Phone: {r.ownerPhone ?? "—"}</span>
            <span>•</span>
            <span>Enrolled: {new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {r.status !== "ACTIVE" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("ACTIVE")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              Set Active
            </Button>
          )}
          {r.status !== "SUSPENDED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange("SUSPENDED")}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium"
            >
              Suspend Tenant
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleOpenActivate}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            <CreditCard className="mr-1.5 h-4 w-4" /> Activate / Renew Plan
          </Button>
        </div>
      </div>

      {/* Grid: Subscription Card & Operational Scale */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscription Status Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Subscription
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {activeSub ? activeSub.status : "No Active Plan"}
            </span>
          </div>

          {activeSub ? (
            <div className="space-y-3">
              <div>
                <div className="text-xl font-bold text-white">
                  {activeSub.plan.name}
                </div>
                <div className="text-xs text-slate-400">
                  {activeSub.billingPeriod} • ₹{Number(activeSub.amount).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 text-xs space-y-1 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Period Start:</span>
                  <span className="text-slate-300">
                    {new Date(activeSub.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires On:</span>
                  <span className="text-slate-200 font-semibold">
                    {new Date(activeSub.endDate).toLocaleDateString()}
                  </span>
                </div>
                {activeSub.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trial Ends:</span>
                    <span className="text-amber-400">
                      {new Date(activeSub.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenActivate}
                className="w-full border-slate-800 text-xs text-slate-300 hover:text-white"
              >
                Change Plan / Extend Validity
              </Button>
            </div>
          ) : (
            <div className="space-y-3 py-2 text-center">
              <p className="text-xs text-slate-400">
                This restaurant currently has no active subscription. Features may be restricted.
              </p>
              <Button
                size="sm"
                onClick={handleOpenActivate}
                className="bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs font-medium"
              >
                Activate Subscription
              </Button>
            </div>
          )}
        </div>

        {/* Operational Limits vs Usage */}
        <div className="md:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Resource Scale vs Plan Limits
            </h2>
            <p className="text-xs text-slate-400">
              Current operational usage across all locations
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-500">Branches</span>
              <div className="text-lg font-bold text-white mt-1">
                {r.branches.length}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {activeSub?.plan.maxBranches ?? "—"}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-500">Staff Users</span>
              <div className="text-lg font-bold text-white mt-1">
                {r.users.length}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {activeSub?.plan.maxUsers ?? "—"}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-500">Dining Tables</span>
              <div className="text-lg font-bold text-white mt-1">
                {metrics.tables}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {activeSub?.plan.maxTables ?? "—"}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="text-[11px] text-slate-500">Menu Items</span>
              <div className="text-lg font-bold text-white mt-1">
                {metrics.products}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  / {activeSub?.plan.maxProducts ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Entitlement Features Chips */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 block mb-2">
              Plan Entitlements:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeSub?.plan.features.map((feat: string) => (
                <span
                  key={feat}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-medium border border-emerald-500/20"
                >
                  ✓ {feat.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff & Locations Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branches */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Branches / Locations ({r.branches.length})
            </h3>
          </div>
          <div className="space-y-2">
            {r.branches.map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{b.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {b.address ?? "No address specified"}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {b.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Members */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Staff Members ({r.users.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {r.users.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{u.name}</div>
                  <div className="text-[11px] text-slate-500">{u.email ?? u.phone}</div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {u.role.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Billing History & Payments */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Subscription Billing & Payment History
          </h3>
          <p className="text-xs text-slate-400">
            Offline & manual payments recorded for this tenant
          </p>
        </div>

        {r.subscriptionPayments && r.subscriptionPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {r.subscriptionPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {p.method.replace("MANUAL_", "")}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {p.reference ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {p.recordedBy?.name ?? "System"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No payments recorded yet for this restaurant.
          </div>
        )}
      </div>

      {/* Manual Subscription Activation Modal */}
      {activateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Activate / Renew Subscription
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivateModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleActivateSubmit} className="space-y-4 pt-4">
              {modalError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Select Plan *
                </Label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setSelectedPlanId(pId);
                    const selected = plans?.find((p) => p.id === pId);
                    if (selected) {
                      setCustomAmount(
                        selectedBilling === "YEARLY"
                          ? Number(selected.yearlyPrice)
                          : Number(selected.monthlyPrice),
                      );
                    }
                  }}
                  className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                >
                  {plans?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.yearlyPrice}/yr • ₹{p.monthlyPrice}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Billing Period *
                  </Label>
                  <select
                    value={selectedBilling}
                    onChange={(e: any) => {
                      const b = e.target.value;
                      setSelectedBilling(b);
                      const selected = plans?.find((p) => p.id === selectedPlanId);
                      if (selected) {
                        if (b === "YEARLY") {
                          setCustomAmount(Number(selected.yearlyPrice));
                          setDurationMonths(12);
                        } else if (b === "HALF_YEARLY") {
                          setCustomAmount(
                            selected.halfYearlyPrice
                              ? Number(selected.halfYearlyPrice)
                              : Number(selected.monthlyPrice) * 6,
                          );
                          setDurationMonths(6);
                        } else if (b === "QUARTERLY") {
                          setCustomAmount(
                            selected.quarterlyPrice
                              ? Number(selected.quarterlyPrice)
                              : Number(selected.monthlyPrice) * 3,
                          );
                          setDurationMonths(3);
                        } else {
                          setCustomAmount(Number(selected.monthlyPrice));
                          setDurationMonths(1);
                        }
                      }
                    }}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                  >
                    <option value="MONTHLY">Monthly (1 Month)</option>
                    <option value="QUARTERLY">Quarterly (3 Months)</option>
                    <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                    <option value="YEARLY">Yearly (12 Months)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Amount Paid (₹) *
                  </Label>
                  <Input
                    type="number"
                    required
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Payment Method *
                  </Label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                  >
                    <option value="MANUAL_BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="MANUAL_UPI">UPI / QR Code</option>
                    <option value="MANUAL_CASH">Cash</option>
                    <option value="MANUAL_CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Payment Ref / UTR #
                  </Label>
                  <Input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UTR19827364"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Notes
                </Label>
                <Input
                  value={subNotes}
                  onChange={(e) => setSubNotes(e.target.value)}
                  placeholder="e.g. Renewal for 2026-2027 fiscal year"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivateModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={activateSubMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {activateSubMutation.isPending
                    ? "Activating..."
                    : "Confirm & Activate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
