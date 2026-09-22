"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";
import { usePublicPlans } from "@/hooks/use-public-plans";

export default function PublicPricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const { data: plans, isLoading, isError } = usePublicPlans();

  const faqs = [
    {
      q: "Can I change my plan as my restaurant grows?",
      a: "Yes, you can upgrade, downgrade, or add branches at any time directly through your dashboard or by contacting platform support.",
    },
    {
      q: "What happens when my 14-day free trial ends?",
      a: "Your data remains completely safe. You can activate a subscription via offline bank transfer, UPI, or online payment to continue accepting orders without interruption.",
    },
    {
      q: "Can I pay manually via bank transfer or cheque?",
      a: "Absolutely. Our platform operators can verify and activate annual or quarterly subscriptions offline with instant GST invoice generation.",
    },
    {
      q: "Is there any special hardware required?",
      a: "OrderRestro runs in any modern browser on iPads, Android tablets, PCs, or Mac. We support standard ESC/POS USB and network thermal receipt and kitchen printers.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <MarketingNav />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Transparent SaaS Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Everything your restaurant needs. One predictable plan.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Zero setup fees. Full POS, KDS, inventory, and table management. Try free for 14 days with no credit card required.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="flex items-center rounded-lg p-1 bg-muted border border-border">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Yearly Billing</span>
                <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-500/20">
                  Save 25%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Plans Grid */}
        {isLoading ? (
          <div className="py-24 text-center text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <span className="text-sm">Loading plans...</span>
          </div>
        ) : isError || !plans ? (
          <div className="py-12 text-center text-rose-400">
            Unable to load pricing plans right now. Please try again shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => {
              const price =
                billingCycle === "yearly"
                  ? Math.round(p.yearlyPrice / 12)
                  : p.monthlyPrice;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-8 flex flex-col justify-between transition-all duration-300 relative ${
                    p.isPopular
                      ? "border-emerald-500/50 bg-card/90 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                      : "border-border/80 bg-card/50"
                  }`}
                >
                  {p.isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider shadow">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                        {p.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-foreground tracking-tight">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          / month
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {billingCycle === "yearly" ? (
                          <span>
                            Billed annually at ₹
                            {p.yearlyPrice.toLocaleString("en-IN")}/year
                          </span>
                        ) : (
                          <span>Billed monthly</span>
                        )}
                      </div>
                    </div>

                    <Link href={`/register?plan=${p.slug}`} className="block">
                      <Button
                        className={`w-full font-semibold transition-all shadow-sm ${
                          p.isPopular
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        Start 14-Day Free Trial
                      </Button>
                    </Link>

                    {/* Scale Quotas */}
                    <div className="rounded-xl bg-muted/50 p-4 border border-border/60 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Locations:</span>
                        <span className="font-semibold text-foreground">
                          {p.limits.maxBranches} Branch
                          {p.limits.maxBranches > 1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Staff Accounts:</span>
                        <span className="font-semibold text-foreground">
                          {p.limits.maxUsers} Users
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dining Tables:</span>
                        <span className="font-semibold text-foreground">
                          Up to {p.limits.maxTables} Tables
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Menu Items:</span>
                        <span className="font-semibold text-foreground">
                          Up to {p.limits.maxProducts} Dishes
                        </span>
                      </div>
                    </div>

                    {/* Included Features */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                        Everything in {p.name}:
                      </span>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {p.features.map((feat) => (
                          <div key={feat} className="flex items-center gap-2.5">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="capitalize">
                              {feat.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/60 mt-6 text-center text-[11px] text-muted-foreground">
                    14-day free trial • Cancel anytime
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQs */}
        <div className="pt-12 border-t border-border/60 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Have questions about billing, setup, or multi-branch management?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {faq.q}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
