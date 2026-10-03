import { LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandFooter({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center p-2 py-3 border-t border-sidebar-border/40">
        <a
          href="https://restro.growthtechnos.com"
          target="_blank"
          rel="noopener noreferrer"
          title="RestroPulse Support"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-sidebar-border/60 bg-sidebar text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-indigo-400 transition-colors shadow-2xs"
        >
          <LifeBuoy className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/40 px-3.5 py-3">
      <a
        href="https://restro.growthtechnos.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-2 text-xs font-semibold text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-indigo-400"
      >
        <LifeBuoy className="h-3.5 w-3.5 text-indigo-500" />
        Contact support
      </a>
      <a
        href="https://restro.growthtechnos.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-[10px] font-medium leading-tight text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:underline tracking-tight"
      >
        RestroPulse · Next-Gen Restaurant OS
      </a>
    </div>
  );
}
