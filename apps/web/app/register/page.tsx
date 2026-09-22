"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublicPlans, usePublicRegister } from "@/hooks/use-public-plans";

export default function PublicRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
          Loading registration...
        </div>
      }
    >
      <PublicRegisterPageInner />
    </Suspense>
  );
}

function PublicRegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const { data: plans, isLoading: plansLoading } = usePublicPlans();
  const registerMutation = usePublicRegister();

  const [restaurantName, setRestaurantName] = useState("");
  const [branchName, setBranchName] = useState("Main Branch");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState("starter");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (planParam) {
      setSelectedPlanSlug(planParam);
    } else if (plans && plans.length > 0) {
      const popular = plans.find((p) => p.isPopular);
      setSelectedPlanSlug(popular ? popular.slug : plans[0].slug);
    }
  }, [planParam, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await registerMutation.mutateAsync({
        restaurantName,
        branchName: branchName || "Main Branch",
        ownerName,
        email,
        phone: phone || undefined,
        password,
        planSlug: selectedPlanSlug,
      });

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Registration failed. Please check your information.",
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased flex-col justify-between py-12 px-4 sm:px-6">
      <div className="w-full max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-400 font-bold text-lg mb-2"
          >
            <UtensilsCrossed className="h-6 w-6" /> OrderRestro
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Start your 14-Day Free Trial
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Set up your restaurant in seconds. No credit card required.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* Restaurant Info */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                1. Restaurant Details
              </span>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  Restaurant Name *
                </Label>
                <Input
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Copper Chimney Bistro"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">
                  First Branch Name
                </Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Main Branch / Downtown"
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Owner Info */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                2. Owner Account
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Your Full Name *
                  </Label>
                  <Input
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Phone Number
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Email Address (Login) *
                  </Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@restaurant.com"
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Password *
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-0.5 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  3. Select Your Trial Plan
                </span>
                <Link
                  href="/pricing"
                  target="_blank"
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Compare plan limits
                </Link>
              </div>

              {plansLoading ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Loading available plans...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans?.map((p) => {
                    const isSelected = selectedPlanSlug === p.slug;
                    return (
                      <button
                        type="button"
                        key={p.slug}
                        onClick={() => setSelectedPlanSlug(p.slug)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500/30"
                            : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <div className="font-bold text-sm text-white flex items-center justify-between">
                          <span>{p.name}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs font-semibold text-emerald-400 mt-1">
                          ₹{Number(p.monthlyPrice).toLocaleString("en-IN")}/mo
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {p.limits.maxBranches} Branch • {p.limits.maxUsers} Users
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md py-5 text-sm"
            >
              {registerMutation.isPending ? (
                "Creating your restaurant..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Launch Restaurant Dashboard <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            Already have a restaurant account?{" "}
            <Link
              href="/login"
              className="text-emerald-400 hover:underline font-medium"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-600 pt-6">
        © {new Date().getFullYear()} OrderRestro SaaS Platform. All rights reserved.
      </div>
    </div>
  );
}
