"use client";

import { ChefHat, CheckCircle2, Clock3, Flame, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KitchenQueue {
  new: number;
  accepted: number;
  preparing: number;
  ready: number;
}

export function KitchenThroughputCard({
  queue,
  isLoading = false,
}: {
  queue?: KitchenQueue;
  isLoading?: boolean;
}) {
  const newCount = queue?.new ?? 0;
  const acceptedCount = queue?.accepted ?? 0;
  const preparingCount = queue?.preparing ?? 0;
  const readyCount = queue?.ready ?? 0;

  const totalInFlight = newCount + acceptedCount + preparingCount + readyCount;

  return (
    <Card className="flex flex-col gap-4 p-6 border-border/80 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ChefHat className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Kitchen Throughput
            </h2>
            <p className="text-xs text-muted-foreground">
              Active KOT ticket velocity & prep funnel
            </p>
          </div>
        </div>
        <Link
          href="/kds"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open KDS Screen →
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-[200px] w-full rounded-xl" />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Funnel pipeline steps */}
          <div className="grid grid-cols-4 gap-2">
            {/* Step 1: New */}
            <div className="flex flex-col items-center rounded-xl border border-primary/20 bg-primary/5 p-3 text-center transition-all hover:bg-primary/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary mb-1">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">New</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {newCount}
              </span>
            </div>

            {/* Step 2: Accepted */}
            <div className="flex flex-col items-center rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center transition-all hover:bg-amber-500/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1">
                <Play className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Accepted</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {acceptedCount}
              </span>
            </div>

            {/* Step 3: Preparing */}
            <div className="flex flex-col items-center rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-center transition-all hover:bg-orange-500/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 mb-1">
                <Flame className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Cooking</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {preparingCount}
              </span>
            </div>

            {/* Step 4: Ready */}
            <div className="flex flex-col items-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center transition-all hover:bg-emerald-500/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">Ready</span>
              <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {readyCount}
              </span>
            </div>
          </div>

          {/* Progress bar visualizing load */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Active Workload</span>
              <span className="font-semibold text-foreground">
                {totalInFlight === 0 ? "All stations clear" : `${totalInFlight} tickets active`}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
              <div
                style={{ width: `${totalInFlight > 0 ? (newCount / totalInFlight) * 100 : 0}%` }}
                className="bg-primary transition-all duration-500"
              />
              <div
                style={{ width: `${totalInFlight > 0 ? (acceptedCount / totalInFlight) * 100 : 0}%` }}
                className="bg-amber-500 transition-all duration-500"
              />
              <div
                style={{ width: `${totalInFlight > 0 ? (preparingCount / totalInFlight) * 100 : 0}%` }}
                className="bg-orange-500 transition-all duration-500"
              />
              <div
                style={{ width: `${totalInFlight > 0 ? (readyCount / totalInFlight) * 100 : 0}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
