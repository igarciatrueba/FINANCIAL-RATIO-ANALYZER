import Link from "next/link";

import { AnalyticalNavigation } from "@/components/layout/navigation";
import { PageIntro } from "@/components/layout/page-intro";
import { PremiumCursorGlow } from "@/components/layout/premium-cursor-glow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  currentPath?: string;
  title?: string;
  subtitle?: string;
};

const pageEyebrows: Record<string, string> = {
  "/analysis": "Financial Health",
  "/analysis/ratios": "Detailed Ratios",
  "/analysis/dupont": "Return on Equity",
  "/input": "Financial Input",
  "/scenario": "Scenario Analysis",
  "/engine-map": "Analytical Architecture",
  "/methodology": "Transparent Methodology",
};

export function AppShell({ children, currentPath, title = "Financial Ratio Analyzer", subtitle }: AppShellProps) {
  return (
    <div className="premium-shell min-h-screen bg-background text-neutral-50">
      <PremiumCursorGlow />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-small focus:font-semibold"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 bg-background/90 px-3 pt-3 backdrop-blur-md print:hidden md:px-6" data-sticky-header="true">
        <div className="premium-panel mx-auto grid max-w-[1340px] gap-2 rounded-xl px-3 py-2 backdrop-blur-xl xl:grid-cols-[minmax(17rem,1fr)_auto_minmax(13rem,1fr)] xl:items-center md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link aria-label="Financial Ratio Analyzer home" className="flex min-w-0 items-center gap-2.5" href="/">
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white shadow-[0_0_20px_rgb(37_99_235/0.4)]">↗</span>
              <span className="truncate text-small font-semibold tracking-tight text-neutral-50">Financial Ratio Analyzer</span>
            </Link>
            <span className="hidden h-5 w-px bg-border 2xl:block" />
            <div className="hidden min-w-0 2xl:block">
              <p className="truncate text-caption font-semibold uppercase tracking-[0.1em] text-neutral-300">{title}</p>
              {subtitle ? <p className="truncate text-caption text-neutral-500">{subtitle}</p> : null}
            </div>
          </div>
          <div className="order-3 min-w-0 overflow-x-auto pb-0.5 xl:order-none">
            <AnalyticalNavigation currentPath={currentPath} />
          </div>
          <div className="hidden justify-end gap-2 xl:flex">
            <Button asChild className="min-h-9 px-3 text-caption" variant="ghost"><Link href="/methodology">Methodology</Link></Button>
            <Button asChild className="min-h-9 px-3 text-caption" variant="secondary"><Link href="/input">Edit financials</Link></Button>
          </div>
        </div>
      </header>

      <main
        className={cn("mx-auto min-h-[calc(100vh-112px)] max-w-[1340px] scroll-mt-40 px-4 py-10 md:px-8 md:py-14")}
        id="main-content"
      >
        <PageIntro eyebrow={pageEyebrows[currentPath ?? ""] ?? "Financial Intelligence"} subtitle={subtitle} title={title} />
        {children}
      </main>
      <p className="hidden print:block print:px-8 print:pb-6 print:text-xs">
        Educational analysis only. This is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.
      </p>
    </div>
  );
}
