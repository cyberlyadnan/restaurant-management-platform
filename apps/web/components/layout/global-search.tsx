"use client";

import {
  CalendarClock,
  ChefHat,
  FileText,
  Flame,
  LayoutDashboard,
  LayoutGrid,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  UserCheck,
  UserPlus,
  UsersRound,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: "Navigation" | "Actions" | "Operations" | "Management";
  href: string;
  icon: LucideIcon;
  keywords: string[];
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Actions
  {
    id: "action-pos-order",
    title: "Create POS Order",
    description: "Launch touch register to take tableside or takeaway orders",
    category: "Actions",
    href: "/pos",
    icon: PlusCircle,
    keywords: ["new", "create", "order", "pos", "bill", "takeaway", "dine-in", "register"],
    badge: "Quick Action",
  },
  {
    id: "action-add-staff",
    title: "Add New Staff Member",
    description: "Create waiter, chef, kitchen staff, or manager account",
    category: "Actions",
    href: "/settings/staff",
    icon: UserPlus,
    keywords: ["create", "staff", "waiter", "kitchen", "chef", "cashier", "manager", "pin", "user"],
    badge: "Owner",
  },
  {
    id: "action-kds-open",
    title: "Open Kitchen Display",
    description: "Monitor live ticket prep, rush orders, and bump stations",
    category: "Actions",
    href: "/kds",
    icon: Flame,
    keywords: ["kds", "kitchen", "cook", "chef", "screen", "live", "tickets", "rush"],
    badge: "Kitchen",
  },
  {
    id: "action-add-dish",
    title: "Add Menu Item / Category",
    description: "Configure food items, pricing, combos, and modifiers",
    category: "Actions",
    href: "/menu",
    icon: UtensilsCrossed,
    keywords: ["dish", "food", "item", "category", "price", "modifier", "combo", "recipe"],
    badge: "Menu",
  },

  // Operations
  {
    id: "nav-pos",
    title: "Point of Sale (POS)",
    description: "Real-time register, table order split, payments & checkout",
    category: "Operations",
    href: "/pos",
    icon: ShoppingCart,
    keywords: ["pos", "register", "terminal", "pay", "card", "cash", "checkout"],
    badge: "Terminal",
  },
  {
    id: "nav-kds",
    title: "Kitchen Display System (KDS)",
    description: "Full-screen prep station tickets, timers, and bump bar",
    category: "Operations",
    href: "/kds",
    icon: ChefHat,
    keywords: ["kds", "cook", "prep", "station", "chef", "kitchen", "bump", "orders"],
    badge: "KDS",
  },
  {
    id: "nav-tables",
    title: "Tables & Floor Plan",
    description: "Interactive floor layouts, occupancy, merge & bill tables",
    category: "Operations",
    href: "/tables",
    icon: LayoutGrid,
    keywords: ["tables", "floor", "layout", "seats", "dining", "patio", "merge"],
    badge: "Floor",
  },
  {
    id: "nav-reservations",
    title: "Table Reservations",
    description: "Upcoming guest bookings, party sizes, and arrival schedules",
    category: "Operations",
    href: "/reservations",
    icon: CalendarClock,
    keywords: ["booking", "reserve", "guest", "calendar", "time", "schedule"],
  },

  // Navigation
  {
    id: "nav-dashboard",
    title: "Dashboard Overview",
    description: "Real-time sales, net revenue, active tables & performance charts",
    category: "Navigation",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["analytics", "revenue", "sales", "home", "stats", "charts", "metrics"],
    badge: "Live",
  },
  {
    id: "nav-menu",
    title: "Menu & Catalog",
    description: "Dishes, combo meals, ingredients, and pricing groups",
    category: "Navigation",
    href: "/menu",
    icon: UtensilsCrossed,
    keywords: ["menu", "food", "drinks", "categories", "modifiers", "pricing"],
  },
  {
    id: "nav-inventory",
    title: "Inventory & Stock",
    description: "Track raw ingredients, stock levels, waste logs & alerts",
    category: "Navigation",
    href: "/inventory",
    icon: Package,
    keywords: ["stock", "ingredients", "waste", "supplies", "storage", "procurement"],
  },
  {
    id: "nav-procurement",
    title: "Purchase Orders & POs",
    description: "Supplier invoices, purchase requests, and delivery receiving",
    category: "Navigation",
    href: "/inventory/purchase-orders",
    icon: FileText,
    keywords: ["po", "procurement", "supplier", "vendor", "invoice", "cost"],
  },
  {
    id: "nav-customers",
    title: "Customer Directory & CRM",
    description: "Customer history, contact info, total spend & loyalty",
    category: "Navigation",
    href: "/customers",
    icon: UserCheck,
    keywords: ["customer", "client", "crm", "guest", "phone", "email", "history"],
  },

  // Management
  {
    id: "nav-staff",
    title: "Staff & User Accounts",
    description: "Manage waiters, chefs, cashiers, managers & PIN codes",
    category: "Management",
    href: "/settings/staff",
    icon: UsersRound,
    keywords: ["staff", "users", "roles", "waiter", "chef", "pin", "permissions", "team"],
    badge: "Admin",
  },
  {
    id: "nav-settings",
    title: "System & Branch Settings",
    description: "Store details, tax rates, printer settings & integrations",
    category: "Management",
    href: "/settings",
    icon: Settings,
    keywords: ["settings", "branch", "config", "tax", "printers", "receipt", "api"],
  },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle on ⌘K / Ctrl+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SEARCH_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;

      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inKeywords = item.keywords.some((k) => k.includes(q));
      const inCategory = item.category.toLowerCase().includes(q);
      return inTitle || inDesc || inKeywords || inCategory;
    });
  }, [query, selectedCategory]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Handle keyboard navigation within results
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1,
      );
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      {/* Search trigger button in the header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex h-10 w-full max-w-[240px] items-center gap-2.5 rounded-xl border border-border/70 bg-muted/30 px-3 text-sm text-muted-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted/60 sm:max-w-[320px] md:max-w-[420px]"
        aria-label="Search navigation and actions"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        <span className="flex-1 truncate text-left text-xs font-normal sm:text-sm text-muted-foreground/90">
          Search dishes, tables, staff...
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/80 bg-background/90 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground shadow-2xs group-hover:border-primary/30 group-hover:text-foreground">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>
      </button>

      {/* Command Palette Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search Restaurant System</DialogTitle>
          </DialogHeader>

          {/* Top Search Bar */}
          <div className="relative flex items-center border-b border-border/70 px-4 py-3.5 bg-background/50">
            <Search className="h-5 w-5 shrink-0 text-primary mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a command or search dishes, tables, roles..."
              className="flex-1 bg-transparent text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground/60 outline-hidden"
              autoFocus
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            )}
          </div>

          {/* Filter category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/50 bg-muted/20 px-4 py-2 text-xs no-scrollbar">
            {["All", "Actions", "Operations", "Navigation", "Management"].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>

          {/* Results list */}
          <div className="max-h-[380px] overflow-y-auto p-2 overscroll-contain">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No matching results found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try searching for &quot;waiter&quot;, &quot;kds&quot;, &quot;tables&quot;, &quot;pos&quot;, or &quot;staff&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all ${
                        isSelected
                          ? "bg-primary/10 text-foreground ring-1 ring-primary/30 dark:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  item.badge === "Owner" || item.badge === "Admin"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    : item.badge === "Kitchen"
                                      ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                      : item.badge === "Live"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : "bg-primary/10 text-primary"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline text-[11px] text-muted-foreground/60 font-mono">
                          {item.href}
                        </span>
                        {isSelected && (
                          <span className="text-primary font-bold text-xs">↵</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Shortcuts Help */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px] shadow-2xs border border-border/80">
                  ↑
                </kbd>
                <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px] shadow-2xs border border-border/80">
                  ↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px] shadow-2xs border border-border/80">
                  ↵
                </kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-background px-1 py-0.5 font-mono text-[10px] shadow-2xs border border-border/80">
                  ESC
                </kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-primary/80 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Nav</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
