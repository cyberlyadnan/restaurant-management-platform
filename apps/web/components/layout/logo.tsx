import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 34,
  showText = true,
  collapsed = false,
}: {
  className?: string;
  size?: number;
  showText?: boolean;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        style={{ width: size, height: size }}
        className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20 transition-all duration-200 group-hover:scale-105"
      >
        <UtensilsCrossed style={{ width: size * 0.52, height: size * 0.52 }} className="stroke-[2.2]" />
      </div>
      {showText && !collapsed && (
        <div className="flex flex-col">
          <span className="text-base font-black tracking-tight text-foreground flex items-center leading-none">
            Restro<span className="text-indigo-500 dark:text-indigo-400">Pulse</span>
          </span>
          <span className="text-[9px] font-extrabold tracking-widest text-muted-foreground/80 uppercase mt-0.5">
            SaaS OS
          </span>
        </div>
      )}
    </div>
  );
}
