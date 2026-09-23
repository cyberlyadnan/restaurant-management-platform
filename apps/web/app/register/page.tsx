"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  Globe,
  Info,
  Lock,
  Mail,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePublicPlans, usePublicRegister } from "@/hooks/use-public-plans";

export default function PublicRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-sm font-medium">Initializing workspace registration...</span>
          </div>
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
  const prefersReducedMotion = useReducedMotion();

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

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

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

      toast.success("Welcome to OrderRestro! Your restaurant workspace is ready.");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Registration failed. Please review your information.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const activePlan = plans?.find((p) => p.slug === selectedPlanSlug);

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Background Lighting Accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-teal-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-emerald-600/5 blur-[150px]" />

      <div className="relative flex w-full flex-col lg:flex-row">
        {/* Left Side: Brand Showcase & Value Props */}
        <div className="hidden lg:flex flex-1 flex-col justify-between border-r border-slate-800/60 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-950 p-12 relative z-10 backdrop-blur-xl">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-emerald-400 font-extrabold text-xl tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span>Nodedr OrderRestro</span>
            </Link>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
              14-Day Free Trial
            </Badge>
          </div>

          {/* Hero Feature Highlights */}
          <div className="my-auto max-w-lg space-y-8 py-8">
            <div className="space-y-3">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Launch Your Restaurant OS in Seconds
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                All-in-one platform for fine dining, QSR & multi-branch chains
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empower your staff with live Kitchen Display System (KDS), cloud POS checkout, table QR self-ordering, blind shift cash counting, and detailed analytics.
              </p>
            </div>

            {/* Feature Bullet Points */}
            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: "Instant Multi-Branch Setup",
                  desc: "Configure tables, menu items, floor layouts, and user roles effortlessly.",
                },
                {
                  icon: ShieldCheck,
                  title: "Enterprise Multi-Tenant Security",
                  desc: "Isolated data schemas, strict branch guards, and automated security monitoring.",
                },
                {
                  icon: ChefHat,
                  title: "Real-Time KDS & Ticket Routing",
                  desc: "Orders sent instantly from POS or diner phone QR direct to kitchen stations.",
                },
                {
                  icon: Store,
                  title: "Split Payments & Shift Audits",
                  desc: "Equal & custom bill splitting, cash drawer movements, and X/Z shift reports.",
                },
              ].map((feat, idx) => (
                <motion.div
                  key={feat.title}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.4 }}
                  className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                    <feat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{feat.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial Quote */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
              <p className="text-xs text-slate-300 italic">
                “OrderRestro simplified our peak lunch rush completely. Table turnaround is 35% faster and shift closing takes less than 2 minutes.”
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-400">— Rajesh Verma, Managing Director</span>
                <span className="text-slate-500 font-medium">Urban Table Group</span>
              </div>
            </div>
          </div>

          {/* System Status Footer */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Platform Engine Operational</span>
            </div>
            <span>No Credit Card Required</span>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 relative z-10 my-auto max-w-2xl mx-auto w-full">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full space-y-6"
          >
            {/* Header (Visible on Mobile + Desktop top indicator) */}
            <div className="space-y-2 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-lg mb-3">
                <UtensilsCrossed className="h-6 w-6" />
                <span>Nodedr OrderRestro</span>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold px-3 py-0.5">
                Step-by-Step Registration
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Start your 14-Day Free Trial
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Setup your restaurant tenant workspace. Instant access to POS, KDS & QR Ordering.
              </p>
            </div>

            {/* Glass Form Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs font-medium text-rose-300 flex items-center gap-2"
                  >
                    <Info className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Section 1: Restaurant Info */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      1
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Restaurant & First Branch
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="restaurantName" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-emerald-400" /> Restaurant Name *
                      </Label>
                      <Input
                        id="restaurantName"
                        required
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="e.g. Copper Chimney Bistro"
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="branchName" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-400" /> Initial Branch
                      </Label>
                      <Input
                        id="branchName"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Main Branch / Downtown"
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Owner Credentials */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      2
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Owner Account Credentials
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="ownerName" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-emerald-400" /> Owner Full Name *
                      </Label>
                      <Input
                        id="ownerName"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-400" /> Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-emerald-400" /> Work Email *
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@restaurant.com"
                        className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-emerald-400" /> Account Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm pr-10"
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

                {/* Section 3: Select Plan */}
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        3
                      </div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Select Trial Plan
                      </h3>
                    </div>
                    <Link
                      href="/pricing"
                      target="_blank"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-medium"
                    >
                      Compare Features <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {plansLoading ? (
                    <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                      Loading plan offerings...
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
                            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50"
                                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:border-slate-700"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-sm text-white flex items-center justify-between">
                                <span>{p.name}</span>
                                {isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  p.isPopular && (
                                    <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase">
                                      Popular
                                    </span>
                                  )
                                )}
                              </div>
                              <div className="text-sm font-extrabold text-emerald-400 mt-1.5">
                                ₹{Number(p.monthlyPrice).toLocaleString("en-IN")}
                                <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60 space-y-0.5">
                              <div>{p.limits.maxBranches} Branch • {p.limits.maxUsers} Users</div>
                              <div>{p.limits.maxTables} Tables • {p.limits.maxProducts} Items</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/50 py-6 text-sm rounded-xl cursor-pointer"
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Provisioning Workspace...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Rocket className="h-4 w-4" /> Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="flex items-center gap-1 text-slate-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Cancel anytime
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Full feature access
                    </span>
                  </div>
                </div>
              </form>

              {/* Login Link */}
              <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Already have a restaurant workspace?{" "}
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
                >
                  Sign in here
                </Link>
              </div>
            </div>
          </motion.div>

          <footer className="text-center text-[11px] text-slate-600 pt-6">
            © {new Date().getFullYear()} OrderRestro SaaS Operating System. All rights reserved.
          </footer>
        </div>
      </div>
    </main>
  );
}
