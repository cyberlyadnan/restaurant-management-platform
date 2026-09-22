"use client";

export function DietaryBadge({
  isVeg,
  size = "md",
  className = "",
}: {
  isVeg: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const outerSize =
    size === "sm"
      ? "h-3.5 w-3.5 border"
      : size === "lg"
        ? "h-5 w-5 border-2"
        : "h-4 w-4 border-[1.5px]";

  const innerSize =
    size === "sm"
      ? "h-1.5 w-1.5"
      : size === "lg"
        ? "h-2.5 w-2.5"
        : "h-2 w-2";

  if (isVeg) {
    return (
      <span
        title="Vegetarian"
        className={`inline-flex shrink-0 items-center justify-center rounded-sm border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30 ${outerSize} ${className}`}
        aria-label="Vegetarian"
      >
        <span className={`rounded-full bg-emerald-600 dark:bg-emerald-500 ${innerSize}`} />
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className={`inline-flex shrink-0 items-center justify-center rounded-sm border-rose-600 bg-rose-50/50 dark:border-rose-500 dark:bg-rose-950/30 ${outerSize} ${className}`}
      aria-label="Non-Vegetarian"
    >
      <span
        className={`rounded-full bg-rose-600 dark:bg-rose-500 ${innerSize}`}
      />
    </span>
  );
}
