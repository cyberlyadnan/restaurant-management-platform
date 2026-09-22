"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useEnrollRestaurant,
  usePlatformPlans,
  usePlatformRestaurants,
} from "@/hooks/use-platform";

export default function PlatformRestaurantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  const { data: restaurants, isLoading, isError } = usePlatformRestaurants(
    search || undefined,
    statusFilter || undefined,
  );

  const { data: plans } = usePlatformPlans();
  const enrollMutation = useEnrollRestaurant();

  // Enrollment Form State
  const [formName, setFormName] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formOwnerEmail, setFormOwnerEmail] = useState("");
  const [formOwnerPhone, setFormOwnerPhone] = useState("");
  const [formPlanId, setFormPlanId] = useState("");
  const [formBilling, setFormBilling] = useState<
    "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY"
  >("MONTHLY");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "TRIAL">("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenEnroll = () => {
    if (plans && plans.length > 0 && !formPlanId) {
      setFormPlanId(plans[0].id);
    }
    setFormError(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await enrollMutation.mutateAsync({
        name: formName,
        ownerName: formOwnerName,
        ownerEmail: formOwnerEmail,
        ownerPhone: formOwnerPhone || undefined,
        planId: formPlanId || (plans?.[0]?.id ?? ""),
        billingPeriod: formBilling,
        status: formStatus,
        branchName: "Main Branch",
        currency: "INR",
        timezone: "Asia/Kolkata",
        initialPassword: "Password123!",
      });
      setEnrollModalOpen(false);
      // Reset form
      setFormName("");
      setFormOwnerName("");
      setFormOwnerEmail("");
      setFormOwnerPhone("");
    } catch (err: any) {
      setFormError(err?.message || "Failed to enroll restaurant.");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Restaurant Tenants
          </h1>
          <p className="text-sm text-slate-400">
            Provision, monitor, and configure independent restaurant accounts
          </p>
        </div>
        <Button
          onClick={handleOpenEnroll}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Enroll New Restaurant
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name, owner, or email..."
            className="pl-9 bg-slate-900/60 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {["", "ACTIVE", "TRIAL", "EXPIRED", "SUSPENDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === st
                  ? "bg-slate-800 text-white border-slate-700"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              }`}
            >
              {st === "" ? "All Statuses" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <span>Loading restaurants...</span>
          </div>
        ) : isError || !restaurants ? (
          <div className="p-8 text-center text-rose-400">
            Failed to load restaurants list.
          </div>
        ) : restaurants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              No restaurants found
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Enroll a new restaurant or adjust search filters.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Owner Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Scale</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {restaurants.map((r) => {
                  const sub = r.activeSubscription;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {r.name}
                        </div>
                        {r.legalName && (
                          <div className="text-[11px] text-slate-500">
                            {r.legalName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300 font-medium">
                          {r.ownerName ?? "—"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {r.ownerEmail ?? "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            statusColors[r.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {sub ? (
                          <div>
                            <div className="font-medium text-emerald-400">
                              {sub.plan.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Expires:{" "}
                              {new Date(sub.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">No active plan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span>{r.branchCount} branch(es)</span> •{" "}
                        <span>{r.userCount} staff</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/restaurants/${r.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
                          >
                            Manage <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Enrollment Slide-over Modal */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Enroll New Restaurant
                </h3>
                <p className="text-xs text-slate-400">
                  Create tenant, owner account, and assign initial subscription
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 pt-4">
              {formError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Restaurant Name *
                </Label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Royal Spice Bistro"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Owner Name *
                  </Label>
                  <Input
                    required
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Owner Phone
                  </Label>
                  <Input
                    value={formOwnerPhone}
                    onChange={(e) => setFormOwnerPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Owner Email (Login Account) *
                </Label>
                <Input
                  type="email"
                  required
                  value={formOwnerEmail}
                  onChange={(e) => setFormOwnerEmail(e.target.value)}
                  placeholder="owner@royalspice.com"
                  className="bg-slate-900 border-slate-800 text-white"
                />
                <span className="text-[11px] text-slate-500">
                  Default temporary password: <strong>Password123!</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Initial Plan *
                  </Label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                  >
                    {plans?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.monthlyPrice}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Billing Period *
                  </Label>
                  <select
                    value={formBilling}
                    onChange={(e: any) => setFormBilling(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-800 px-3 text-xs text-white"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly (3 Months)</option>
                    <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                    <option value="YEARLY">Yearly (12 Months)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Initial Account Status
                </Label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formStatus === "ACTIVE"}
                      onChange={() => setFormStatus("ACTIVE")}
                    />
                    <span>Active (Paid / Subscribed)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="TRIAL"
                      checked={formStatus === "TRIAL"}
                      onChange={() => setFormStatus("TRIAL")}
                    />
                    <span>14-Day Free Trial</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEnrollModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {enrollMutation.isPending
                    ? "Provisioning Tenant..."
                    : "Create & Enroll"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
