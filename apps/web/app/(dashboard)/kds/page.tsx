"use client";

import type { KotStatusDto } from "@nodedr-restaurant/types";
import {
  Bell,
  ChefHat,
  Clock,
  Flame,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Utensils,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PerformanceWidget } from "@/components/kds/performance-widget";
import { TicketCard } from "@/components/kds/ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useKdsTickets, type KotTicket } from "@/hooks/use-kds";
import { cn } from "@/lib/utils";

interface KdsColumnConfig {
  status: KotStatusDto;
  label: string;
  dotColor: string;
  badgeBg: string;
  borderColor: string;
}

const COLUMNS: Record<string, KdsColumnConfig> = {
  NEW: {
    status: "NEW",
    label: "New Orders",
    dotColor: "bg-primary animate-pulse",
    badgeBg: "bg-primary/10 text-primary border-primary/20",
    borderColor: "border-primary/30",
  },
  ACCEPTED: {
    status: "ACCEPTED",
    label: "Accepted",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  PREPARING: {
    status: "PREPARING",
    label: "Cooking / Prep",
    dotColor: "bg-orange-500",
    badgeBg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    borderColor: "border-orange-500/30",
  },
  READY: {
    status: "READY",
    label: "Ready to Serve",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
};

const COLUMN_LIST = [
  COLUMNS.NEW,
  COLUMNS.ACCEPTED,
  COLUMNS.PREPARING,
  COLUMNS.READY,
];

export default function KdsPage() {
  const { branchId } = useBranch();
  const { data: tickets, isLoading, refetch, isRefetching } = useKdsTickets(branchId);
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract unique stations from tickets
  const stations = useMemo(() => {
    const set = new Map<string, string>();
    tickets?.forEach((t) => {
      if (t.station) {
        set.set(t.station.id, t.station.name);
      }
    });
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [tickets]);

  // Filter tickets by station
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (selectedStation === "ALL") return tickets;
    return tickets.filter((t) => t.station?.id === selectedStation);
  }, [tickets, selectedStation]);

  const byStatus = (status: KotStatusDto): KotTicket[] =>
    filteredTickets.filter((t) => t.status === status);

  const totalActive = filteredTickets.length;
  const urgentCount = filteredTickets.filter((t) => {
    const elapsed = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 60_000);
    return elapsed >= 15 || t.isPriority;
  }).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full max-w-[1920px] mx-auto pb-6">
      {/* KDS Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ChefHat className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Kitchen Display Screen (KDS)
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 text-xs shadow-2xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Kitchen Sync
            </Badge>

            {urgentCount > 0 && (
              <Badge
                variant="destructive"
                className="gap-1 font-bold animate-bounce text-xs"
              >
                🔥 {urgentCount} Urgent / Rush
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time station order routing, live prep latency tracking & priority alerts
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled((v) => !v)}
            className="h-8 gap-1.5 text-xs"
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="hidden md:inline">{soundEnabled ? "Sound On" : "Muted"}</span>
          </Button>

          {/* Fullscreen Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 gap-1.5 text-xs"
            title="Toggle fullscreen monitor mode"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </Button>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            Sync
          </Button>
        </div>
      </div>

      {/* Station Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedStation("ALL")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              selectedStation === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            All Stations ({tickets?.length ?? 0})
          </button>
          {stations.map((st) => {
            const count = tickets?.filter((t) => t.station?.id === st.id).length ?? 0;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStation(st.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  selectedStation === st.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {st.name} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-bold text-foreground">{totalActive}</span> tickets
        </div>
      </div>

      {/* Performance Widget Bar */}
      <PerformanceWidget branchId={branchId} />

      {/* 4 Pipeline Stage Columns */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2 xl:grid-cols-4 min-h-[520px]">
        {COLUMN_LIST.map((col) => {
          const colTickets = byStatus(col.status);

          return (
            <div
              key={col.status}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border-2 p-3 bg-card/60 backdrop-blur-xs overflow-hidden shadow-xs",
                col.borderColor,
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.dotColor)} />
                  <h2 className="text-sm font-bold text-foreground">{col.label}</h2>
                </div>
                <Badge
                  variant="outline"
                  className={cn("px-2 py-0 text-xs font-extrabold tabular-nums", col.badgeBg)}
                >
                  {colTickets.length}
                </Badge>
              </div>

              {/* Ticket Cards Stream */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-2 pr-1">
                {isLoading &&
                  Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-2xl" />
                  ))}

                {colTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} branchId={branchId} />
                ))}

                {!isLoading && colTickets.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-muted-foreground/60">
                    <Utensils className="h-8 w-8 mb-2 stroke-[1.5]" />
                    <p className="text-xs font-medium">No tickets in this stage</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
