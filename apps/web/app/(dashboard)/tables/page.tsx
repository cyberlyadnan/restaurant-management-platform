"use client";

import type { TableStatusDto } from "@nodedr-restaurant/types";
import {
  CheckCircle2,
  Clock,
  Grid2X2,
  LayoutGrid,
  Map as MapIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AddFloorDialog } from "@/components/tables/add-floor-dialog";
import { EditableTableTile } from "@/components/tables/editable-table-tile";
import { RenameFloorDialog } from "@/components/tables/rename-floor-dialog";
import { TableCard } from "@/components/tables/table-card";
import { TableEditorDialog } from "@/components/tables/table-editor-dialog";
import { TableTile } from "@/components/tables/table-tile";
import { WaitlistPanel } from "@/components/tables/waitlist-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBranch } from "@/hooks/use-branch";
import { useFloors, type RestaurantTable } from "@/hooks/use-tables";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | TableStatusDto;

export default function TablesPage() {
  const { branchId } = useBranch();
  const { data: floors, isLoading } = useFloors(branchId);
  const [activeFloorId, setActiveFloorId] = useState<string | undefined>(undefined);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "canvas">("grid");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorTable, setEditorTable] = useState<RestaurantTable | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const activeFloor = floors?.find((f) => f.id === (activeFloorId ?? floors[0]?.id));
  const allTables = floors?.flatMap((f) => f.tables) ?? [];
  const floorTables = activeFloor?.tables ?? [];
  const availableTables = allTables.filter((t) => t.status === "AVAILABLE");

  // Summary Metrics for Active Floor
  const floorMetrics = useMemo(() => {
    const total = floorTables.length;
    const totalCapacity = floorTables.reduce((acc, t) => acc + t.capacity, 0);
    const occupied = floorTables.filter((t) => t.status === "OCCUPIED");
    const occupiedSeats = occupied.reduce((acc, t) => acc + t.capacity, 0);
    const available = floorTables.filter((t) => t.status === "AVAILABLE");
    const availableSeats = available.reduce((acc, t) => acc + t.capacity, 0);
    const reserved = floorTables.filter((t) => t.status === "RESERVED");
    const cleaning = floorTables.filter((t) => t.status === "CLEANING");

    const occupancyRate = total > 0 ? Math.round((occupied.length / total) * 100) : 0;

    return {
      total,
      totalCapacity,
      occupiedCount: occupied.length,
      occupiedSeats,
      availableCount: available.length,
      availableSeats,
      reservedCount: reserved.length,
      cleaningCount: cleaning.length,
      occupancyRate,
    };
  }, [floorTables]);

  // Filtered Tables
  const visibleTables = useMemo(() => {
    return floorTables.filter((table) => {
      const matchesStatus = statusFilter === "ALL" || table.status === statusFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        (table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        table.number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [floorTables, statusFilter, searchQuery]);

  const canvasWidth = activeFloor
    ? Math.max(650, ...activeFloor.tables.map((t) => t.posX + t.width + 40))
    : 650;
  const canvasHeight = activeFloor
    ? Math.max(380, ...activeFloor.tables.map((t) => t.posY + t.height + 40))
    : 380;

  const openAddTable = () => {
    setEditorTable(null);
    setEditorOpen(true);
    setEditorKey((k) => k + 1);
  };
  const openEditTable = (table: RestaurantTable) => {
    setEditorTable(table);
    setEditorOpen(true);
    setEditorKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Floor Plan & Tables
            </h1>
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/10 text-primary font-medium px-2.5 py-0.5 text-xs shadow-2xs"
            >
              <Utensils className="h-3 w-3" />
              {activeFloor?.name ?? "Main Floor"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {editMode
              ? "Drag and drop tables to arrange layout — coordinates save automatically"
              : "Live restaurant table occupancy, dining timers & order routing"}
          </p>
        </div>

        {floors && floors.length > 0 && (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setViewMode("grid");
                  if (editMode) setEditMode(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "grid" && !editMode
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === "canvas" || editMode
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Canvas Plan
              </button>
            </div>

            {/* Edit Mode Toggle */}
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setEditMode((v) => !v);
                if (!editMode) setViewMode("canvas");
              }}
              className="gap-1.5 text-xs h-8 shadow-xs"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editMode ? "Done Editing" : "Edit Layout"}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : floors && floors.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            {/* Quick Floor Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Total Tables */}
              <Card className="flex flex-col justify-between p-4 border-border/80 shadow-2xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Floor Capacity
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {floorMetrics.total} <span className="text-xs font-normal text-muted-foreground">tables</span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {floorMetrics.totalCapacity} seats
                  </span>
                </div>
              </Card>

              {/* Card 2: Available */}
              <Card className="flex flex-col justify-between p-4 border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Available
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {floorMetrics.availableCount}
                  </span>
                  <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                    {floorMetrics.availableSeats} open seats
                  </span>
                </div>
              </Card>

              {/* Card 3: Occupied */}
              <Card className="flex flex-col justify-between p-4 border-rose-500/20 bg-rose-500/5 shadow-2xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Occupied
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                    {floorMetrics.occupiedCount}
                  </span>
                  <span className="text-xs font-medium text-rose-600/80 dark:text-rose-400/80">
                    {floorMetrics.occupiedSeats} seated ({floorMetrics.occupancyRate}%)
                  </span>
                </div>
              </Card>

              {/* Card 4: Reserved & Cleaning */}
              <Card className="flex flex-col justify-between p-4 border-border/80 shadow-2xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Turnaround
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {floorMetrics.reservedCount + floorMetrics.cleaningCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {floorMetrics.reservedCount} rsv · {floorMetrics.cleaningCount} clean
                  </span>
                </div>
              </Card>
            </div>

            {/* Floor Selector Tabs & Controls Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {floors.length > 1 && (
                  <Tabs value={activeFloorId ?? floors[0].id} onValueChange={setActiveFloorId}>
                    <TabsList className="bg-secondary/60 p-0.5">
                      {floors.map((floor) => (
                        <TabsTrigger key={floor.id} value={floor.id} className="text-xs font-medium px-3 py-1">
                          {floor.name}
                          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                            {floor.tables.length}
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}

                {editMode && (
                  <div className="flex items-center gap-1.5">
                    <RenameFloorDialog
                      branchId={branchId}
                      floorId={activeFloor?.id ?? floors[0].id}
                      currentName={activeFloor?.name ?? floors[0].name}
                    />
                    <AddFloorDialog branchId={branchId} />
                    <Button variant="default" size="sm" onClick={openAddTable} className="gap-1 text-xs h-8">
                      <Plus className="h-3.5 w-3.5" />
                      Add Table
                    </Button>
                  </div>
                )}
              </div>

              {/* Search input for quick lookup */}
              {!editMode && (
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search table..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-card"
                  />
                </div>
              )}
            </div>

            {/* Filter Pills Bar (Grid Mode only) */}
            {!editMode && viewMode === "grid" && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 pb-3">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    statusFilter === "ALL"
                      ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Tables ({floorTables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("AVAILABLE")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    statusFilter === "AVAILABLE"
                      ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Available ({floorMetrics.availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("OCCUPIED")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    statusFilter === "OCCUPIED"
                      ? "bg-rose-600 text-white shadow-2xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Occupied ({floorMetrics.occupiedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("RESERVED")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    statusFilter === "RESERVED"
                      ? "bg-amber-600 text-white shadow-2xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Reserved ({floorMetrics.reservedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("CLEANING")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                    statusFilter === "CLEANING"
                      ? "bg-indigo-600 text-white shadow-2xs font-semibold"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Cleaning ({floorMetrics.cleaningCount})
                </button>
              </div>
            )}

            {/* Main Presentation Surface */}
            {viewMode === "grid" && !editMode ? (
              /* RESPONSIVE GRID VIEW (Clean, Professional, Fully Responsive) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {visibleTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    allTables={allTables}
                    branchId={branchId}
                  />
                ))}

                {visibleTables.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Utensils className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-base font-semibold text-foreground">No tables found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchQuery
                        ? `No table matching "${searchQuery}" in this floor.`
                        : "No tables in this status category."}
                    </p>
                    {statusFilter !== "ALL" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="mt-4 text-xs"
                      >
                        Show All Tables
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ARCHITECTURAL CANVAS VIEW (With Blueprint Grid Backdrop) */
              <Card className="overflow-auto p-6 relative border-border/80 bg-card/60">
                {/* Architectural Blueprint Grid Background */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(var(--border) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div
                  className="relative transition-all"
                  style={{ width: canvasWidth, height: canvasHeight, minWidth: "100%" }}
                >
                  {activeFloor?.tables.map((table) =>
                    editMode ? (
                      <EditableTableTile
                        key={table.id}
                        table={table}
                        branchId={branchId}
                        onEdit={() => openEditTable(table)}
                      />
                    ) : (
                      <TableTile
                        key={table.id}
                        table={table}
                        allTables={allTables}
                        branchId={branchId}
                        style={{
                          left: table.posX,
                          top: table.posY,
                          width: table.width,
                          height: table.height,
                        }}
                      />
                    ),
                  )}
                  {activeFloor?.tables.length === 0 && (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No tables on this floor yet. Tap &ldquo;Add Table&rdquo; to begin.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Status Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/40 pt-3">
              <div className="flex flex-wrap items-center gap-4">
                <Legend color="bg-emerald-500" label="Available (Ready to seat)" />
                <Legend color="bg-rose-500" label="Occupied (Active service)" />
                <Legend color="bg-amber-500" label="Reserved (Booked)" />
                <Legend color="bg-indigo-500" label="Cleaning / Resetting" />
              </div>
              <span className="text-[11px] font-medium">
                Tap table for order, billing, and QR controls
              </span>
            </div>
          </div>

          {/* Waitlist Sidebar Panel */}
          <WaitlistPanel branchId={branchId} availableTables={availableTables} />
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <p className="text-sm font-medium text-foreground">No floors yet</p>
          <p className="text-sm text-muted-foreground">Add your first floor to start building the layout.</p>
          <AddFloorDialog branchId={branchId} />
        </Card>
      )}

      {activeFloor && (
        <TableEditorDialog
          key={editorKey}
          branchId={branchId}
          floorId={activeFloor.id}
          table={editorTable}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color} shadow-2xs`} />
      <span>{label}</span>
    </div>
  );
}
