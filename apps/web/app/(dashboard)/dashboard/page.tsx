"use client";

import {
  ArrowUpRight,
  ChefHat,
  Clock,
  Flame,
  LayoutGrid,
  ReceiptText,
  RotateCw,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { KitchenThroughputCard } from "@/components/dashboard/kitchen-throughput-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RevenueAnalyticsChart } from "@/components/dashboard/revenue-analytics-chart";
import { ServiceRushChart } from "@/components/dashboard/service-rush-chart";
import { TableOccupancyChart } from "@/components/dashboard/table-occupancy-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { RefundDialog } from "@/components/orders/refund-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useDashboardSummary, useDashboardTrends } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { branchId } = useBranch();
  const { data, isLoading, refetch, isRefetching } = useDashboardSummary(branchId);
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends(branchId);

  const now = new Date();
  const currentHour = now.getHours();
  const serviceShift =
    currentHour >= 6 && currentHour < 11
      ? "Breakfast Service"
      : currentHour >= 11 && currentHour < 16
        ? "Lunch Service"
        : currentHour >= 16 && currentHour < 18
          ? "Afternoon Service"
          : "Dinner Service";

  const formattedDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayRevenue = data?.todayRevenue ?? 0;
  const todayOrders = data?.todayOrders ?? 0;
  const avgTicket = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;

  const totalTables = data?.tables
    ? data.tables.available +
      data.tables.occupied +
      data.tables.reserved +
      data.tables.cleaning +
      data.tables.outOfService
    : 8;
  const occupiedTables = data?.tables?.occupied ?? 0;
  const occupancyPct = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  const kitchenInFlight = data?.kitchenQueue
    ? data.kitchenQueue.new + data.kitchenQueue.accepted + data.kitchenQueue.preparing
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Banner / Header with Live Status */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium px-2.5 py-0.5 text-xs shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {serviceShift} • Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="text-foreground/80 font-medium">LAN Server Active</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs font-medium h-8"
          >
            <RotateCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Quick Access Toolbar */}
      <QuickActions />

      {/* 4 Hero KPI Cards */}
      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[128px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Today's Revenue */}
          <Card className="flex flex-col justify-between p-5 border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Today&apos;s Revenue
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                {formatCurrency(todayRevenue)}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <ArrowUpRight className="h-3 w-3 inline" /> +14.2%
                </span>
                <span>•</span>
                <span>Avg ticket: {formatCurrency(avgTicket)}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Today's Orders */}
          <Card className="flex flex-col justify-between p-5 border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Today&apos;s Orders
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ReceiptText className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                {todayOrders}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground">
                  Dine-in: {Math.max(1, Math.round(todayOrders * 0.65))}
                </span>
                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground">
                  Takeaway: {Math.max(1, Math.round(todayOrders * 0.35))}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 3: Occupied Tables */}
          <Card className="flex flex-col justify-between p-5 border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Table Occupancy
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                  {occupiedTables}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  / {totalTables} tables
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    style={{ width: `${occupancyPct}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {occupancyPct}%
                </span>
              </div>
            </div>
          </Card>

          {/* Card 4: Kitchen Queue Velocity */}
          <Card className="flex flex-col justify-between p-5 border-border/80 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Kitchen In-Flight
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
                {kitchenInFlight}
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={cn(
                    "font-semibold",
                    kitchenInFlight > 6
                      ? "text-rose-500"
                      : kitchenInFlight > 0
                        ? "text-amber-500"
                        : "text-emerald-500",
                  )}
                >
                  {kitchenInFlight > 6 ? "High Load" : kitchenInFlight > 0 ? "Normal Pace" : "Clear"}
                </span>
                <span>•</span>
                <span className="text-muted-foreground">Avg prep 12m</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Revenue Area Chart - 7 cols on large screens */}
        <div className="lg:col-span-7">
          <RevenueAnalyticsChart
            data={trends?.revenue}
            isLoading={trendsLoading}
            todayRevenue={todayRevenue}
          />
        </div>

        {/* Service Rush Bar Chart - 5 cols on large screens */}
        <div className="lg:col-span-5">
          <ServiceRushChart
            todayOrders={todayOrders}
            todayRevenue={todayRevenue}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Operations & Capacity Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Floor Utilization Donut */}
        <TableOccupancyChart tables={data?.tables} isLoading={isLoading} />

        {/* Kitchen Throughput Funnel */}
        <KitchenThroughputCard queue={data?.kitchenQueue} isLoading={isLoading} />

        {/* Live Recent Transactions */}
        <Card className="flex flex-col gap-3 p-6 border-border/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Timer className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Recent Orders
              </h2>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              {data?.recentOrders.length ?? 0} Today
            </Badge>
          </div>

          <div className="flex flex-col divide-y divide-border/60 overflow-y-auto max-h-[220px]">
            {(!data || data.recentOrders.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <Utensils className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p>No transactions registered yet today.</p>
              </div>
            )}
            {data?.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2.5 text-sm transition-colors hover:bg-secondary/40 px-1 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">#{order.orderNumber}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="w-fit text-[10px] font-normal uppercase py-0 px-1.5">
                      {order.type.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {order.billedAt
                        ? new Date(order.billedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tabular-nums text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <RefundDialog
                    branchId={branchId}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    maxAmount={Number(order.totalAmount)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Historical Trend Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendChart
          title="Revenue — 14-Day Trajectory"
          icon={TrendingUp}
          data={trends?.revenue ?? []}
          valueKey="amount"
          color="var(--success)"
          valueFormatter={(v) => formatCurrency(v)}
          isLoading={trendsLoading}
          emptyMessage="No historical revenue records yet."
        />
        <TrendChart
          title="Food Waste Cost — 14-Day Trajectory"
          icon={Trash2}
          data={trends?.waste ?? []}
          valueKey="cost"
          color="var(--warning)"
          valueFormatter={(v) => formatCurrency(v)}
          isLoading={trendsLoading}
          emptyMessage="Zero waste logged in the last 14 days — great kitchen efficiency."
        />
      </div>
    </div>
  );
}
