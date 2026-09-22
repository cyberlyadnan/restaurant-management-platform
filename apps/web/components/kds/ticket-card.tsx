"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  Play,
  Printer,
  Sparkles,
  Star,
  Timer,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  NEXT_STATUS,
  useReprintKot,
  useSetKotPriority,
  useUpdateKotStatus,
  type KotTicket,
} from "@/hooks/use-kds";
import { cn } from "@/lib/utils";

const STATUS_BUTTON: Record<
  string,
  { label: string; icon: typeof Play; colorClass: string }
> = {
  NEW: {
    label: "Accept Ticket",
    icon: CheckCircle2,
    colorClass:
      "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs",
  },
  ACCEPTED: {
    label: "Start Cooking",
    icon: Flame,
    colorClass:
      "bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs",
  },
  PREPARING: {
    label: "Mark Ready",
    icon: CheckCircle2,
    colorClass:
      "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs",
  },
  READY: {
    label: "Bump / Served",
    icon: ChefHat,
    colorClass:
      "bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs",
  },
};

function useElapsedMinutes(createdAt: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const compute = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000)));
    compute();
    const id = setInterval(compute, 15_000);
    return () => clearInterval(id);
  }, [createdAt]);
  return elapsed;
}

export function TicketCard({
  ticket,
  branchId,
}: {
  ticket: KotTicket;
  branchId: string | null;
}) {
  const elapsed = useElapsedMinutes(ticket.createdAt);
  const updateStatus = useUpdateKotStatus(branchId);
  const setPriority = useSetKotPriority(branchId);
  const reprint = useReprintKot(branchId);
  const nextStatus = NEXT_STATUS[ticket.status];

  // Urgency classification based on ticket wait time
  const isUrgent = elapsed >= 18;
  const isWarning = elapsed >= 10 && elapsed < 18;

  const btnConfig = STATUS_BUTTON[ticket.status] ?? {
    label: "Next Stage",
    icon: Play,
    colorClass: "bg-primary text-primary-foreground",
  };
  const BtnIcon = btnConfig.icon;

  return (
    <Card
      className={cn(
        "group relative flex shrink-0 flex-col justify-between rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 overflow-hidden bg-card",
        ticket.isPriority
          ? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 shadow-md"
          : isUrgent
            ? "border-destructive ring-2 ring-destructive/30 bg-destructive/5 animate-pulse"
            : isWarning
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-border/80 hover:border-border",
      )}
    >
      {/* Priority Banner when starred */}
      {ticket.isPriority && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white text-[11px] font-extrabold uppercase tracking-wider py-0.5 px-3 flex items-center justify-center gap-1.5 shadow-xs">
          <Star className="h-3 w-3 fill-white" />
          Rush Order / High Priority
        </div>
      )}

      {/* Ticket Header */}
      <div className={cn("flex flex-col gap-2.5", ticket.isPriority && "pt-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-foreground font-mono">
                #{ticket.ticketNumber || ticket.order.orderNumber}
              </span>
              {ticket.station && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold uppercase px-1.5 py-0 bg-secondary/80 border border-border"
                >
                  {ticket.station.name}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span className="font-semibold text-foreground">
                {ticket.order.table ? `Table ${ticket.order.table.number}` : ticket.order.type}
              </span>
              <span>•</span>
              <span className="text-[11px]">
                {new Date(ticket.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Time Elapsed Timer Badge */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums border shadow-2xs",
              isUrgent
                ? "bg-destructive text-destructive-foreground border-destructive animate-bounce"
                : isWarning
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
                  : elapsed < 5
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-secondary text-foreground border-border",
            )}
          >
            <Timer className="h-3 w-3" />
            {elapsed}m
          </div>
        </div>

        {/* Food Items List with Big Bold Quantities for 5ft Kitchen Viewing */}
        <div className="flex flex-col divide-y divide-border/60 border-y border-border/80 py-2 my-1">
          {ticket.items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 py-2 first:pt-1 last:pb-1">
              <div className="flex items-baseline gap-2.5">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-foreground text-background font-extrabold text-sm px-1.5 shadow-2xs tabular-nums">
                  {item.orderItem.quantity}×
                </span>
                <span className="text-[15px] font-bold tracking-tight text-foreground leading-snug">
                  {item.orderItem.nameSnapshot}
                </span>
              </div>

              {/* Modifiers Pill Badges */}
              {item.orderItem.modifiers && item.orderItem.modifiers.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-8">
                  {item.orderItem.modifiers.map((m, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-secondary border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      +{m.nameSnapshot}
                    </span>
                  ))}
                </div>
              )}

              {/* Kitchen Special Instructions Note */}
              {item.orderItem.kitchenNote && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-800 dark:text-amber-300 font-semibold mt-0.5 ml-8">
                  <Flame className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>Note: {item.orderItem.kitchenNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Large Touch-Friendly Actions for Kitchen Gloves / Tablets */}
      <div className="mt-3 flex items-center gap-2 pt-2">
        {nextStatus && (
          <Button
            size="default"
            className={cn("flex-1 h-10 gap-2 text-sm", btnConfig.colorClass)}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: ticket.id, status: nextStatus })}
          >
            <BtnIcon className="h-4 w-4" />
            {updateStatus.isPending ? "Updating…" : btnConfig.label}
          </Button>
        )}

        {/* Priority Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 border-border shadow-xs",
            ticket.isPriority && "bg-rose-500/15 border-rose-500/40 text-rose-600",
          )}
          title={ticket.isPriority ? "Remove rush priority" : "Mark as rush priority"}
          disabled={setPriority.isPending}
          onClick={() =>
            setPriority.mutate({ id: ticket.id, isPriority: !ticket.isPriority })
          }
        >
          <Star
            className={cn(
              "h-4 w-4",
              ticket.isPriority ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
            )}
          />
        </Button>

        {/* Reprint KOT */}
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 border-border text-muted-foreground hover:text-foreground shadow-xs"
          title="Reprint physical KOT ticket"
          disabled={reprint.isPending}
          onClick={() =>
            reprint.mutate(ticket.id, {
              onSuccess: () => toast.success(`Ticket #${ticket.ticketNumber} sent to printer`),
            })
          }
        >
          <Printer className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
