"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Sparkles } from "lucide-react";
import { useRestaurantBilling } from "@/hooks/use-restaurant-billing";

export function SubscriptionBanner() {
  const { data: billing } = useRestaurantBilling();

  if (!billing || !billing.subscription) return null;

  const { subscription, plan } = billing;

  if (subscription.status === "TRIAL") {
    return (
      <div className="bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 border-b border-indigo-500/30 px-4 py-2 text-xs flex items-center justify-between gap-3 text-indigo-200">
        <div className="flex items-center gap-2 truncate">
          <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0 animate-pulse" />
          <span>
            You have <strong className="text-white font-bold">{subscription.daysRemaining} days</strong> remaining in your{" "}
            <strong className="text-indigo-300 font-semibold">{plan?.name ?? "Starter"}</strong> free trial.
          </span>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md transition-colors text-[11px] shadow-sm flex-shrink-0"
        >
          Upgrade Plan <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  if (subscription.status === "EXPIRED" || subscription.status === "SUSPENDED") {
    return (
      <div className="bg-gradient-to-r from-rose-900/90 via-rose-950 to-slate-900 border-b border-rose-500/30 px-4 py-2 text-xs flex items-center justify-between gap-3 text-rose-200">
        <div className="flex items-center gap-2 truncate">
          <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
          <span>
            Your subscription has <strong className="text-white font-bold">{subscription.status.toLowerCase()}</strong>. Ordering mutations are restricted.
          </span>
        </div>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1 font-semibold text-white bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-md transition-colors text-[11px] shadow-sm flex-shrink-0"
        >
          Renew Now <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}
