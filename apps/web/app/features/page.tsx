"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Clock,
  Layers,
  LayoutGrid,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Button } from "@/components/ui/button";

export default function PublicFeaturesPage() {
  const pillars = [
    {
      icon: Zap,
      title: "Lightning-Fast Point of Sale",
      tagline: "Built for peak dinner rush speed",
      description:
        "Take orders in seconds with full category navigation, search, custom modifier groups, dietary indicators (Veg/Non-Veg/Jain), and 1-tap bill settlements.",
      highlights: [
        "Table-side, takeaway, delivery & drive-thru workflows",
        "Visual split payments (Cash, UPI, Cards, Gift Cards)",
        "Integrated thermal receipt & KOT printing (ESC/POS)",
        "Instant discounts with role-gated approvals",
      ],
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      icon: ChefHat,
      title: "Live Kitchen Display System (KDS)",
      tagline: "Replace lost paper tickets forever",
      description:
        "Route dishes automatically to their designated kitchen station (Main Kitchen, Bar, Grill, Bakery) with live status transitions and elapsed prep timers.",
      highlights: [
        "Real-time ticket bump bar (NEW ➔ PREPARING ➔ READY ➔ SERVED)",
        "Color-coded priority alerts for delayed tickets",
        "Station filtering for multi-chef kitchen coordination",
        "Direct kitchen notes and item-level modifications",
      ],
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: LayoutGrid,
      title: "Interactive Floor & Table Designer",
      tagline: "Know your dining room at a glance",
      description:
        "Design your custom restaurant floor layout with drag-and-drop tables, shapes, and capacities. Monitor real-time dining durations and waiter assignments.",
      highlights: [
        "Color-coded table states (Available, Occupied, Reserved, Cleaning)",
        "Active dining timer measuring exact table occupancy duration",
        "Dedicated QR code generation for contactless table-side ordering",
        "Real-time waitlist and guest reservation management",
      ],
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: Package,
      title: "Inventory & Store Procurement",
      tagline: "Accurate food cost accounting to the rupee",
      description:
        "Track ingredient stocks automatically through recipe lines. Generate purchase requests, supplier quotations, goods receipts (GRN), and waste logs.",
      highlights: [
        "Weighted average costing (WAC) recalculated on every goods receipt",
        "Append-only stock movement ledger preventing drift",
        "Batch tracking with expiration date alerts",
        "Food waste tracking with root cause categorization",
      ],
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Users,
      title: "Guest CRM & Automated Loyalty",
      tagline: "Turn first-time guests into lifelong regulars",
      description:
        "Capture customer preferences, allergies, birthdays, and anniversaries. Automatically award loyalty points on net spend and provide store credit wallets.",
      highlights: [
        "Configurable loyalty earn rate and point redemption value",
        "Digital wallet balance / store credit management",
        "Customer lifetime visit and spend analytics",
        "Gift card issuance and one-touch redemption",
      ],
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      icon: Store,
      title: "Multi-Location Enterprise Control",
      tagline: "Scale from 1 location to 50 seamlessly",
      description:
        "Manage menus, staff roles, and analytics across all your branches from a unified dashboard while maintaining strict data isolation.",
      highlights: [
        "Granular 22-permission RBAC (Owner, Manager, Cashier, Waiter, Chef)",
        "Instant branch switching with centralized reporting",
        "Audit log tracking every financial mutation and price adjustment",
        "Automatic cloud database backups to your private S3 bucket",
      ],
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <MarketingNav />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-20">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Full-Stack Restaurant Operating System
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Built for speed, precision, and multi-location growth
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Explore the integrated modules powering hundreds of orders every minute with zero friction.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-border/70 bg-card/60 p-6 flex flex-col justify-between backdrop-blur-sm space-y-6 hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${pillar.bg} ${pillar.color} border ${pillar.border}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {pillar.title}
                    </h3>
                    <p className="text-xs font-medium text-emerald-500 mt-0.5">
                      {pillar.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    {pillar.highlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-950 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ready to upgrade your restaurant operations?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Get started in under 3 minutes. Full platform access with a 14-day free trial.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg"
              >
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                View Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
