import Link from "next/link";
import { BookOpen, Gauge, LayoutDashboard, Network, SlidersHorizontal, TableProperties } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavigationItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
};

export const APP_NAVIGATION: NavigationItem[] = [
  {
    label: "Overview",
    href: "/analysis",
    icon: LayoutDashboard,
  },
  {
    label: "Financial Input",
    href: "/input",
    icon: TableProperties,
  },
  {
    label: "Ratio Analysis",
    href: "/analysis/ratios",
    icon: Gauge,
  },
  {
    label: "DuPont Analysis",
    href: "/analysis/dupont",
    icon: Network,
  },
  {
    label: "Scenario Lab",
    href: "/scenario",
    icon: SlidersHorizontal,
  },
  {
    label: "Methodology",
    href: "/methodology",
    icon: BookOpen,
  },
];

type PrimaryNavigationProps = {
  currentPath?: string;
  compact?: boolean;
  label?: string;
};

export function PrimaryNavigation({ currentPath, compact = false, label = "Primary" }: PrimaryNavigationProps) {
  return (
    <nav aria-label={label}>
      <ul className={cn("grid gap-2", compact && "gap-1")}>
        {APP_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const isCurrent = currentPath === item.href;

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-small font-medium text-neutral-300 transition-colors duration-150 hover:border-border hover:bg-surface-elevated hover:text-neutral-50",
                  isCurrent && "border-border bg-surface-elevated text-neutral-50"
                )}
                href={item.href}
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
