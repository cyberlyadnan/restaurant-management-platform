"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { usePlatformDashboard } from "@/hooks/use-platform";

export default function PlatformDashboardPage() {
  const { data: stats, isLoading, isError } = usePlatformDashboard();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <span>Aggregating Platform Metrics...</span>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
        Failed to load platform dashboard metrics.
      </div>
    );
  }

  const kpis = [
    {
      title: "Monthly Recurring Revenue",
      value: `₹${stats.monthlyRecurringRevenue.toLocaleString("en-IN")}`,
      subtitle: "Active recurring subscriptions",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Revenue Collected",
      value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
      subtitle: "Lifetime platform billing",
      icon: CreditCard,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Active Restaurants",
      value: stats.activeRestaurants,
      subtitle: `${stats.totalRestaurants} total enrolled`,
      icon: UtensilsCrossed,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      subtitle: `${stats.trialRestaurants} in trial period`,
      icon: CheckCircle2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SaaS Platform Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time multi-tenant health, recurring billing, and customer growth
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/restaurants">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              <UtensilsCrossed className="mr-2 h-4 w-4" /> Enroll Restaurant
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`rounded-xl border ${kpi.border} bg-slate-900/60 p-5 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {kpi.title}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expiry Alert Card if any */}
      {stats.expiringIn7Days > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-sm">
                {stats.expiringIn7Days} restaurant subscription(s) expiring within 7 days.
              </span>
              <span className="text-xs text-amber-300/80 block sm:inline sm:ml-2">
                Review and extend or issue renewal invoices.
              </span>
            </div>
          </div>
          <Link href="/admin/subscriptions?status=ACTIVE">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            >
              Review Expiring
            </Button>
          </Link>
        </div>
      )}

      {/* Revenue Trend Chart & Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Revenue Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Monthly billed subscription payments
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Plan Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Active subscriptions by SaaS tier
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {stats.planDistribution.map((item) => {
              const total = stats.activeSubscriptions || 1;
              const pct = Math.round((item.count / total) * 100);

              return (
                <div key={item.planName} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">
                      {item.planName}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Manage Tiers & Limits</span>
            <Link
              href="/admin/plans"
              className="text-emerald-400 hover:underline font-semibold"
            >
              Configure Plans →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Restaurants Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Recently Enrolled Restaurants
            </h2>
            <p className="text-xs text-slate-400">
              Latest tenants onboarded to the platform
            </p>
          </div>
          <Link href="/admin/restaurants">
            <Button variant="ghost" size="sm" className="text-xs text-emerald-400 hover:text-emerald-300">
              View All Restaurants →
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Enrolled</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.recentRestaurants.map((r) => {
                const statusColors: Record<string, string> = {
                  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  TRIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  EXPIRED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
                  PENDING_APPROVAL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                };

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {r.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div>{r.ownerName ?? "—"}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.ownerEmail ?? "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-300">
                        {r.planName ?? "None"}
                      </span>
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
      </div>
    </div>
  );
}
