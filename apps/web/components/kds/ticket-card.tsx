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
      "bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xs",
  },
  ACCEPTED: {
    label: "Start Cooking",
    icon: Flame,
    colorClass:
      "bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs",
  },
  PREPARING: {
    label: "Mark Ready",
    icon: CheckCircle2,
    colorClass:
      "bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-xs",
  },
  READY: {
    label: "Bump / Served",
    icon: ChefHat,
    colorClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs",
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

  const ticketTitle = ticket.ticketNumber || ticket.order.orderNumber;
  const isDineIn = Boolean(ticket.order.table);
  const locationLabel = isDineIn
    ? `Table ${ticket.order.table?.number}`
    : ticket.order.type || "TAKEAWAY";

  return (
    <Card
      className={cn(
        "group relative flex shrink-0 flex-col justify-between rounded-2xl border p-3.5 shadow-sm transition-all duration-200 overflow-hidden bg-card/95 backdrop-blur-xs select-none",
        ticket.isPriority
          ? "border-rose-500/80 ring-2 ring-rose-500/30 bg-rose-500/5 shadow-md"
          : isUrgent
            ? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 animate-pulse"
            : isWarning
              ? "border-amber-500/60 bg-amber-500/5"
              : "border-border/70 hover:border-border/90",
      )}
    >
      {/* Priority Banner when starred */}
      {ticket.isPriority && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-0.5 px-3 flex items-center justify-center gap-1.5 shadow-2xs">
          <Star className="h-3 w-3 fill-white" />
          Rush Priority Order
        </div>
      )}

      {/* Ticket Header Container */}
      <div className={cn("flex flex-col gap-2", ticket.isPriority && "pt-3")}>
        {/* Header Top Meta Row: Station Badge + Order Type + Elapsed Timer */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Station Tag */}
            {ticket.station && (
              <span className="inline-flex items-center rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-400 shrink-0">
                {ticket.station.name}
              </span>
            )}
            {/* Order Type / Table */}
            <span className="inline-flex items-center rounded-md bg-secondary border border-border/60 px-2 py-0.5 text-[10px] font-bold text-foreground shrink-0">
              {locationLabel}
            </span>
          </div>

          {/* Time Elapsed Timer Badge */}
          <div
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold tabular-nums border shadow-2xs",
              isUrgent
                ? "bg-rose-600 text-white border-rose-600 animate-bounce"
                : isWarning
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : elapsed < 5
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-secondary text-foreground border-border/80",
            )}
          >
            <Timer className="h-3 w-3" />
            {elapsed}m
          </div>
        </div>

        {/* Header Main Row: Ticket Number & Order Time */}
        <div className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h3
              title={`#${ticketTitle}`}
              className="text-base font-extrabold tracking-tight font-mono text-foreground truncate whitespace-nowrap leading-none"
            >
              #{ticketTitle}
            </h3>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground shrink-0 font-mono">
            {new Date(ticket.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Food Items List with Compact Bold Quantities */}
        <div className="flex flex-col divide-y divide-border/40 py-1 my-0.5">
          {ticket.items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 py-1.5 first:pt-0.5 last:pb-0.5">
              <div className="flex items-start gap-2">
                <span className="flex h-5.5 min-w-[24px] items-center justify-center rounded-md bg-foreground text-background font-black text-xs px-1 shadow-2xs tabular-nums shrink-0 mt-0.5">
                  {item.orderItem.quantity}×
                </span>
                <span className="text-sm font-bold tracking-tight text-foreground leading-snug break-words flex-1">
                  {item.orderItem.nameSnapshot}
                </span>
              </div>

              {/* Modifiers Badges */}
              {item.orderItem.modifiers && item.orderItem.modifiers.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-7">
                  {item.orderItem.modifiers.map((m, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-secondary/80 border border-border/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      +{m.nameSnapshot}
                    </span>
                  ))}
                </div>
              )}

              {/* Kitchen Special Instructions Note */}
              {item.orderItem.kitchenNote && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2 py-1 text-[11px] text-amber-400 font-semibold mt-0.5 ml-7">
                  <Flame className="h-3 w-3 shrink-0 text-amber-400" />
                  <span>Note: {item.orderItem.kitchenNote}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Large Touch-Friendly Actions for Kitchen Gloves / Kiosk */}
      <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-border/50">
        {nextStatus && (
          <Button
            size="default"
            className={cn("flex-1 h-9 gap-1.5 text-xs font-bold shadow-2xs", btnConfig.colorClass)}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: ticket.id, status: nextStatus })}
          >
            <BtnIcon className="h-3.5 w-3.5" />
            {updateStatus.isPending ? "Updating…" : btnConfig.label}
          </Button>
        )}

        {/* Priority Toggle */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 border-border/80 shadow-2xs hover:bg-secondary",
            ticket.isPriority && "bg-rose-500/15 border-rose-500/40 text-rose-500",
          )}
          title={ticket.isPriority ? "Remove rush priority" : "Mark as rush priority"}
          disabled={setPriority.isPending}
          onClick={() =>
            setPriority.mutate({ id: ticket.id, isPriority: !ticket.isPriority })
          }
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              ticket.isPriority ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
            )}
          />
        </Button>

        {/* Reprint KOT */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground shadow-2xs hover:bg-secondary"
          title="Reprint physical KOT ticket"
          disabled={reprint.isPending}
          onClick={() =>
            reprint.mutate(ticket.id, {
              onSuccess: () => toast.success(`Ticket #${ticket.ticketNumber} sent to printer`),
            })
          }
        >
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
