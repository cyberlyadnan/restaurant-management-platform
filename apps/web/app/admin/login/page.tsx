"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Terminal,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformLogin } from "@/hooks/use-platform";

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = usePlatformLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await loginMutation.mutateAsync({ email, password });
      toast.success("Platform operator authenticated! Loading command center...");
      router.push("/admin/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Invalid platform credentials. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@orderrestro.com");
    setPassword("admin123456");
    toast.info("Super Admin demo credentials auto-filled");
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 text-slate-100 antialiased">
      {/* Background Cyber Grid & Glow Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[160px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-30 blur-md" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-emerald-500/30 text-emerald-400 shadow-xl">
              <ShieldCheck className="h-7 w-7" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                Platform Console
              </Badge>
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                Super Admin
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              OrderRestro Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              SaaS Infrastructure, Multi-Tenant Provisioning & System Operator Access
            </p>
          </div>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <KeyRound className="h-4 w-4 text-emerald-400" />
              <span>Operator Authentication</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Restricted Portal
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-300"
              >
                {errorMsg}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-400" /> Operator Email
              </Label>
              <Input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@orderrestro.com"
                className="bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500 h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="admin-password" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" /> Security Token / Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold transition-all shadow-lg shadow-emerald-950/50 py-5 text-sm rounded-xl cursor-pointer mt-2"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Authenticating Session...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Platform Console <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick Demo Operator Fill */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider text-center">
              Developer & Operator Quick Access
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full text-left rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 p-3 transition-all flex items-center justify-between group hover:border-emerald-500/40"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" /> Super Admin Credentials
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  admin@orderrestro.com • admin123456
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-1 rounded-md group-hover:bg-emerald-500/20">
                Auto Fill
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col items-center justify-center space-y-2 text-center text-xs text-slate-500">
          <div>
            Restaurant tenant owner or cashier?{" "}
            <a
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
            >
              Restaurant Staff Login
            </a>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span>OrderRestro Core v2.4.0</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-emerald-500" /> Platform Engine Active
            </span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
