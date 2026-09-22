"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaasCta() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-background p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_80%),transparent_70%)]"
        />

        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> 14-Day Free Trial
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ready to experience the future of restaurant management?
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground">
            Join hundreds of modern restaurants, bars, and cloud kitchens scaling effortlessly with OrderRestro.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/10"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-sm font-semibold border-border hover:bg-muted"
              >
                Explore Pricing Plans
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Instant provisioning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
