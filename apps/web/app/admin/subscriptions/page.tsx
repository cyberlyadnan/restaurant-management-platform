"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCancelSubscription,
  useExtendSubscription,
  usePlatformSubscriptions,
} from "@/hooks/use-platform";

export default function PlatformSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: subscriptions, isLoading, isError } =
    usePlatformSubscriptions(statusFilter || undefined);

  const extendMutation = useExtendSubscription();
  const cancelMutation = useCancelSubscription();

  const handleExtend = async (id: string, name: string) => {
    if (confirm(`Extend subscription for ${name} by 30 days?`)) {
      await extendMutation.mutateAsync({ id, days: 30 });
    }
  };

  const handleCancel = async (id: string, name: string) => {
    const reason = prompt(`Reason for cancelling subscription for ${name}:`);
    if (reason !== null) {
      await cancelMutation.mutateAsync({ id, reason });
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    TRIAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    EXPIRED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
    CANCELLED: "bg-slate-800 text-slate-400 border-slate-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subscription Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Monitor and manually manage all active, trial, and expiring restaurant subscriptions
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["", "ACTIVE", "TRIAL", "EXPIRED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              statusFilter === st
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
            }`}
          >
            {st === "" ? "All Subscriptions" : st}
          </button>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-3" />
            <span>Loading subscriptions...</span>
          </div>
        ) : isError || !subscriptions ? (
          <div className="p-8 text-center text-rose-400">
            Failed to load subscriptions.
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50 text-slate-400" />
            <div className="text-sm font-semibold text-slate-300">
              No subscriptions found
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Cycle & Amount</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions.map((s) => {
                  const isExpiringSoon =
                    new Date(s.endDate).getTime() - Date.now() <
                    7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/restaurants/${s.restaurant.id}`}
                          className="font-semibold text-slate-200 hover:text-emerald-400"
                        >
                          {s.restaurant.name}
                        </Link>
                        <div className="text-[11px] text-slate-500">
                          {s.restaurant.ownerEmail ?? "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {s.plan.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div>
                          ₹{Number(s.amount).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.billingPeriod}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-300">
                          {new Date(s.startDate).toLocaleDateString()} ➔{" "}
                          <span
                            className={
                              isExpiringSoon && s.status === "ACTIVE"
                                ? "text-amber-400 font-semibold"
                                : ""
                            }
                          >
                            {new Date(s.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isExpiringSoon && s.status === "ACTIVE" && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            Expiring in &lt;7 days
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            statusColors[s.status] || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleExtend(s.id, s.restaurant.name)
                            }
                            className="h-7 text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800"
                            title="Extend validity by 30 days"
                          >
                            <RotateCw className="h-3.5 w-3.5 mr-1" /> +30 Days
                          </Button>
                          {s.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCancel(s.id, s.restaurant.name)
                              }
                              className="h-7 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
