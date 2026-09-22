"use client";

import { useState } from "react";
import { Check, Edit, Layers, Plus, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePlan,
  usePlatformPlans,
  useUpdatePlan,
} from "@/hooks/use-platform";
import type { PlanDto } from "@nodedr-restaurant/types";

const ALL_FEATURES = [
  { key: "pos", label: "POS Point of Sale" },
  { key: "kds", label: "Kitchen Display (KDS)" },
  { key: "tables", label: "Table Floor Management" },
  { key: "menu", label: "Menu & Modifiers" },
  { key: "inventory", label: "Inventory & Stock Ledger" },
  { key: "recipes", label: "Recipe Costing & Ingredients" },
  { key: "crm", label: "Customer CRM & History" },
  { key: "loyalty", label: "Loyalty Points & Wallet" },
  { key: "reservations", label: "Reservations & Waitlist" },
  { key: "analytics", label: "Advanced Analytics & Trends" },
  { key: "procurement", label: "Purchase Orders & Quotations" },
  { key: "multi_branch", label: "Multi-Branch Central Control" },
  { key: "api_access", label: "Integrations & API Keys" },
  { key: "audit_log", label: "Audit Logging" },
  { key: "backup", label: "Automated Cloud Backups" },
];

export default function PlatformPlansPage() {
  const { data: plans, isLoading, isError } = usePlatformPlans();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState(2999);
  const [yearlyPrice, setYearlyPrice] = useState(26999);
  const [trialDays, setTrialDays] = useState(14);
  const [maxBranches, setMaxBranches] = useState(1);
  const [maxUsers, setMaxUsers] = useState(5);
  const [maxTables, setMaxTables] = useState(20);
  const [maxProducts, setMaxProducts] = useState(100);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isPopular, setIsPopular] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName("");
    setSlug("");
    setDescription("");
    setMonthlyPrice(2999);
    setYearlyPrice(26999);
    setTrialDays(14);
    setMaxBranches(1);
    setMaxUsers(5);
    setMaxTables(20);
    setMaxProducts(100);
    setSelectedFeatures(["pos", "kds", "tables", "menu", "reports"]);
    setIsPopular(false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanDto) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description ?? "");
    setMonthlyPrice(Number(plan.monthlyPrice));
    setYearlyPrice(Number(plan.yearlyPrice));
    setTrialDays(plan.trialDays);
    setMaxBranches(plan.maxBranches);
    setMaxUsers(plan.maxUsers);
    setMaxTables(plan.maxTables);
    setMaxProducts(plan.maxProducts);
    setSelectedFeatures(plan.features || []);
    setIsPopular(plan.isPopular);
    setFormError(null);
    setModalOpen(true);
  };

  const toggleFeature = (key: string) => {
    if (selectedFeatures.includes(key)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== key));
    } else {
      setSelectedFeatures([...selectedFeatures, key]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingPlan) {
        await updatePlanMutation.mutateAsync({
          id: editingPlan.id,
          dto: {
            name,
            description,
            monthlyPrice,
            yearlyPrice,
            trialDays,
            maxBranches,
            maxUsers,
            maxTables,
            maxProducts,
            features: selectedFeatures,
            isPopular,
          },
        });
      } else {
        await createPlanMutation.mutateAsync({
          name,
          slug,
          description,
          monthlyPrice,
          yearlyPrice,
          trialDays,
          maxBranches,
          maxUsers,
          maxTables,
          maxProducts,
          features: selectedFeatures,
          isPopular,
          currency: "INR",
          isActive: true,
          sortOrder: (plans?.length ?? 0) + 1,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save plan.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subscription Plans & Tiers
          </h1>
          <p className="text-sm text-slate-400">
            Define pricing, operational quotas, and feature entitlements for the platform
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Custom Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
          <span>Loading plans...</span>
        </div>
      ) : isError || !plans ? (
        <div className="p-8 text-center text-rose-400">
          Failed to load subscription plans.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-6 flex flex-col justify-between backdrop-blur-sm transition-all relative ${
                p.isPopular
                  ? "border-emerald-500/50 bg-slate-900/80 shadow-lg shadow-emerald-500/5"
                  : "border-slate-800/80 bg-slate-900/50"
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.description ?? "Restaurant plan tier"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(p)}
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      ₹{Number(p.yearlyPrice).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / year
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                    or ₹{Number(p.monthlyPrice).toLocaleString("en-IN")}/month
                  </div>
                </div>

                {/* Quotas */}
                <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Branches:</span>
                    <span className="font-semibold text-white">
                      {p.maxBranches}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Staff Accounts:</span>
                    <span className="font-semibold text-white">{p.maxUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Tables:</span>
                    <span className="font-semibold text-white">{p.maxTables}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Menu Items:</span>
                    <span className="font-semibold text-white">
                      {p.maxProducts}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Included Capabilities
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {p.features?.map((feat: string) => (
                      <div key={feat} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="capitalize">
                          {feat.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {p._count?.subscriptions ?? 0} active subscribers
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(p)}
                  className="text-xs border-slate-800 text-slate-300"
                >
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create SaaS Plan"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {formError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Plan Name *
                  </Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Starter"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    URL Slug *
                  </Label>
                  <Input
                    required
                    disabled={Boolean(editingPlan)}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="starter"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Description
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Target audience and brief summary"
                  className="bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Monthly Price (₹) *
                  </Label>
                  <Input
                    type="number"
                    required
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Yearly Price (₹) *
                  </Label>
                  <Input
                    type="number"
                    required
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(Number(e.target.value))}
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Trial Days
                  </Label>
                  <Input
                    type="number"
                    required
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="rounded-lg bg-slate-900/60 p-3.5 border border-slate-800/80 space-y-3">
                <span className="text-xs font-semibold text-white block">
                  Resource Limits & Quotas
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <Label className="text-[11px] text-slate-400">Branches</Label>
                    <Input
                      type="number"
                      value={maxBranches}
                      onChange={(e) => setMaxBranches(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs h-8 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400">Users</Label>
                    <Input
                      type="number"
                      value={maxUsers}
                      onChange={(e) => setMaxUsers(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs h-8 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400">Tables</Label>
                    <Input
                      type="number"
                      value={maxTables}
                      onChange={(e) => setMaxTables(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs h-8 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400">Products</Label>
                    <Input
                      type="number"
                      value={maxProducts}
                      onChange={(e) => setMaxProducts(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-xs h-8 text-white mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">
                  Feature Entitlements
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.key);
                    return (
                      <button
                        type="button"
                        key={feat.key}
                        onClick={() => toggleFeature(feat.key)}
                        className={`text-left p-2 rounded border text-xs transition-colors flex items-center gap-2 ${
                          isChecked
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        <div
                          className={`h-3.5 w-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                            isChecked
                              ? "bg-emerald-500 text-slate-950"
                              : "border border-slate-700"
                          }`}
                        >
                          {isChecked && "✓"}
                        </div>
                        <span className="truncate">{feat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded border-slate-700"
                />
                <Label
                  htmlFor="isPopular"
                  className="text-xs text-slate-300 cursor-pointer"
                >
                  Mark as &quot;Most Popular&quot; plan on public pricing page
                </Label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-800 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending
                    ? "Saving..."
                    : "Save Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
