import Link from "next/link";
import { BookOpen, Braces, Gauge, LayoutDashboard, Network, SlidersHorizontal, TableProperties } from "lucide-react";

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
    label: "Engine Map",
    href: "/engine-map",
    icon: Braces,
  },
  {
    label: "Methodology",
    href: "/methodology",
    icon: BookOpen,
  },
];

const analyticalItems = APP_NAVIGATION.filter((item) => ["/analysis", "/analysis/ratios", "/analysis/dupont", "/scenario", "/engine-map"].includes(item.href));
const compactActionItems = APP_NAVIGATION.filter((item) => ["/input", "/methodology"].includes(item.href));

export function AnalyticalNavigation({ currentPath }: { currentPath?: string }) {
  return (
    <nav aria-label="Global navigation">
      <ul className="flex min-w-max items-center gap-1">
        {analyticalItems.map((item) => {
          const Icon = item.icon;
          const current = item.href === currentPath;
          return <li key={item.href}><Link aria-current={current ? "page" : undefined} className={cn("relative flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-caption font-semibold text-neutral-400 transition-all duration-200 hover:border-blue-400/25 hover:bg-blue-500/10 hover:text-white", current && "crystal-surface border-blue-300/35 text-white shadow-[0_7px_18px_rgb(37_99_235/0.15)]")} href={item.href}><Icon aria-hidden="true" className="h-3.5 w-3.5 text-information" /><span className="relative z-10">{item.label}</span>{current ? <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-px bg-blue-200 shadow-[0_0_10px_#60a5fa]" /> : null}</Link></li>;
        })}
        {compactActionItems.map((item) => { const Icon = item.icon; return <li className="xl:hidden" key={item.href}><Link className="flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-caption font-semibold text-neutral-400" href={item.href}><Icon aria-hidden="true" className="h-3.5 w-3.5 text-information" />{item.label}</Link></li>; })}
      </ul>
    </nav>
  );
}

type PrimaryNavigationProps = {
  currentPath?: string;
  compact?: boolean;
  label?: string;
  orientation?: "vertical" | "horizontal";
};

export function PrimaryNavigation({
  currentPath,
  compact = false,
  label = "Primary",
  orientation = "vertical",
}: PrimaryNavigationProps) {
  return (
    <nav aria-label={label}>
      <ul
        className={cn(
          "grid gap-2",
          compact && "gap-1",
          orientation === "horizontal" && "flex min-w-max items-center gap-1"
        )}
      >
        {APP_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const isCurrent = currentPath === item.href;

          return (
            <li key={item.href}>
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-small font-semibold text-neutral-300 transition-all duration-200 hover:border-blue-400/25 hover:bg-blue-400/8 hover:text-neutral-50",
                  orientation === "horizontal" && "whitespace-nowrap px-2.5 py-1.5 text-caption md:px-3 md:py-1.5",
                  isCurrent && "border-blue-400/25 bg-blue-500/12 text-neutral-50"
                )}
                href={item.href}
              >
                <Icon aria-hidden="true" className={cn("h-5 w-5 text-information", orientation === "horizontal" && "h-3.5 w-3.5")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
