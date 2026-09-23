"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginDto } from "@nodedr-restaurant/types";
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

const DEMO_CREDENTIALS = [
  { label: "Owner / Manager", email: "owner@demo.com", role: "Full Access" },
  { label: "POS Cashier", email: "cashier@demo.com", role: "Register & Bills" },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const prefersReducedMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (dto: LoginDto) => {
    login.mutate(dto, {
      onSuccess: () => {
        toast.success("Welcome back! Loading your workspace...");
        router.push("/dashboard");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Invalid credentials");
      },
    });
  };

  const handleDemoFill = (email: string) => {
    setValue("email", email);
    setValue("password", "password123");
    toast.info(`Filled demo credentials for ${email}`);
  };

  return (
    <main className="relative flex min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Background Ambient Lighting Elements */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-teal-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[150px]" />

      <div className="relative flex w-full flex-col lg:flex-row">
        {/* Left Side: Brand Showcase & Value Props (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 flex-col justify-between border-r border-slate-800/60 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-950 p-12 relative z-10 backdrop-blur-xl">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-emerald-400 font-extrabold text-xl tracking-tight">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-md">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <span>Nodedr OrderRestro</span>
            </Link>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              SaaS Multi-Tenant
            </Badge>
          </div>

          {/* Center Content / Hero Features */}
          <div className="my-auto max-w-lg space-y-8">
            <div className="space-y-3">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold gap-1.5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Next-Gen Restaurant Operating System
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Streamline operations across dining floor, POS & kitchen
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Empower your restaurant staff with multi-tender bill splitting, cash drawer shift reconciliation, visual floor management, and real-time WebSocket ordering.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5 shadow-2xs backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Cash Drawer & Shifts</span>
                </div>
                <p className="text-[11px] text-slate-400">Blind cash drops, floats & automated Z-Reports</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5 shadow-2xs backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <div className="h-2 w-2 rounded-full bg-teal-400" />
                  <span>Split Bill & Multi-Pay</span>
                </div>
                <p className="text-[11px] text-slate-400">Equal diner split, seat tickets & tender attribution</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5 shadow-2xs backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Table Operations</span>
                </div>
                <p className="text-[11px] text-slate-400">Visual table relocation, merging & unmerging</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-1.5 shadow-2xs backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Real-Time KDS</span>
                </div>
                <p className="text-[11px] text-slate-400">Instant kitchen ticket staging & status sync</p>
              </div>
            </div>
          </div>

          {/* Bottom Security / Status Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/60 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Isolated Multi-Tenant Architecture
            </span>
            <span className="font-mono text-[11px]">v2.5.0 • 99.9% Uptime</span>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-12 relative z-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md space-y-8"
          >
            {/* Mobile Header Logo */}
            <div className="flex lg:hidden flex-col items-center text-center space-y-2">
              <Link href="/" className="inline-flex items-center gap-2 text-emerald-400 font-extrabold text-xl">
                <UtensilsCrossed className="h-6 w-6" /> OrderRestro
              </Link>
            </div>

            {/* Title */}
            <div className="space-y-2 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Sign in to your account
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Enter your restaurant credentials to access POS & Management.
              </p>
            </div>

            {/* Quick Demo Credentials Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Quick Demo Auto-Fill:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDENTIALS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleDemoFill(demo.email)}
                    className="flex flex-col items-start rounded-lg border border-slate-800 bg-slate-950 p-2 text-left hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-xs"
                  >
                    <span className="font-bold text-slate-200">{demo.label}</span>
                    <span className="text-[10px] text-emerald-400">{demo.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Card Form */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@restaurant.com"
                    className="h-11 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 font-medium"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-400" /> Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 pr-10 font-medium"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-400 font-medium">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <span>Authenticating…</span>
                  ) : (
                    <>
                      <span>Sign In to Restaurant</span>
                      <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-2">
              <p>
                New restaurant?{" "}
                <Link href="/register" className="font-bold text-emerald-400 hover:underline">
                  Start Free Trial
                </Link>
              </p>
              <Link href="/admin/login" className="text-slate-500 hover:text-slate-300 font-medium">
                Platform Console
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
