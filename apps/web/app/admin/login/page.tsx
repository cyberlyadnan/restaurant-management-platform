"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
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
      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Invalid platform credentials. Please try again.",
      );
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@orderrestro.com");
    setPassword("admin123456");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            OrderRestro Platform
          </h1>
          <p className="text-sm text-slate-400">
            SaaS Operator & Infrastructure Control Center
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-300">
                Operator Email
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@orderrestro.com"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md mt-2"
            >
              {loginMutation.isPending ? (
                "Signing In..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Platform Console <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider text-center">
              Quick Operator Sign-In
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full text-left rounded-lg bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 p-2.5 transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                  Super Admin
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  admin@orderrestro.com • admin123456
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded">
                Fill
              </span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Restaurant staff or owner?{" "}
          <a
            href="/login"
            className="text-emerald-400 hover:underline font-medium"
          >
            Restaurant Login
          </a>
        </div>
      </div>
    </div>
  );
}
