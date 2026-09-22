"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableData {
  available: number;
  occupied: number;
  reserved: number;
  cleaning: number;
  outOfService: number;
}

export function TableOccupancyChart({
  tables,
  isLoading = false,
}: {
  tables?: TableData;
  isLoading?: boolean;
}) {
  const data = useMemo(() => {
    if (!tables) {
      return [
        { name: "Available", value: 6, color: "#22C55E" },
        { name: "Occupied", value: 2, color: "var(--primary)" },
        { name: "Reserved", value: 1, color: "#F59E0B" },
        { name: "Cleaning", value: 1, color: "#94A3B8" },
      ];
    }

    return [
      { name: "Available", value: tables.available, color: "#22C55E" },
      { name: "Occupied", value: tables.occupied, color: "var(--primary)" },
      { name: "Reserved", value: tables.reserved, color: "#F59E0B" },
      { name: "Cleaning", value: tables.cleaning, color: "#94A3B8" },
    ].filter((item) => item.value > 0);
  }, [tables]);

  const totalTables = tables
    ? tables.available + tables.occupied + tables.reserved + tables.cleaning + tables.outOfService
    : 10;

  const occupiedCount = tables?.occupied ?? 2;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

  return (
    <Card className="flex flex-col gap-4 p-6 border-border/80 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Floor Utilization
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time table status & dining capacity
            </p>
          </div>
        </div>
        <Link
          href="/tables"
          className="text-xs font-medium text-primary hover:underline"
        >
          View Floor Plan →
        </Link>
      </div>

      {isLoading ? (
        <Skeleton className="h-[200px] w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
          {/* Donut chart */}
          <div className="relative h-[180px] sm:col-span-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-card p-2 text-xs shadow-md">
                          <span className="font-semibold text-foreground">{d.name}: </span>
                          <span className="tabular-nums font-bold">{d.value} tables</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center percentage badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                {occupancyRate}%
              </span>
              <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
                Occupancy
              </span>
            </div>
          </div>

          {/* Breakdown legend */}
          <div className="flex flex-col gap-2.5 sm:col-span-6 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {tables?.available ?? 6}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-xs" />
                <span className="text-muted-foreground">Occupied</span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {tables?.occupied ?? 2}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
                <span className="text-muted-foreground">Reserved</span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {tables?.reserved ?? 1}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shadow-xs" />
                <span className="text-muted-foreground">Cleaning / Reset</span>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {tables?.cleaning ?? 1}
              </span>
            </div>
            <div className="mt-1 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Total Tables</span>
              <span className="font-bold text-foreground">{totalTables}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
