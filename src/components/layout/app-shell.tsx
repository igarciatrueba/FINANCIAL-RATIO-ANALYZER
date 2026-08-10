import Link from "next/link";

import { PrimaryNavigation } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  currentPath?: string;
  title?: string;
  subtitle?: string;
};

export function AppShell({ children, currentPath, title = "Financial Ratio Analyzer", subtitle }: AppShellProps) {
  return (
    <div className="premium-shell min-h-screen bg-background text-neutral-50">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-small focus:font-semibold"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 bg-background/90 px-3 pt-3 backdrop-blur-md print:hidden md:px-6" data-sticky-header="true">
        <div className="premium-panel mx-auto grid max-w-[1340px] gap-2 rounded-xl px-3 py-2 backdrop-blur-xl md:grid-cols-[minmax(13rem,1fr)_auto] md:items-center md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link aria-label="Financial Ratio Analyzer home" className="flex min-w-0 items-center gap-2.5" href="/">
              <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-blue-400 text-sm font-bold text-white shadow-[0_0_20px_rgb(37_99_235/0.4)]">↗</span>
              <span className="truncate text-small font-semibold tracking-tight text-neutral-50">Financial Ratio Analyzer</span>
            </Link>
            <span className="hidden h-5 w-px bg-border lg:block" />
            <div className="hidden min-w-0 lg:block">
              <h1 className="truncate text-caption font-semibold uppercase tracking-[0.1em] text-neutral-300">{title}</h1>
              {subtitle ? <p className="truncate text-caption text-neutral-500">{subtitle}</p> : null}
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto pb-0.5">
            <PrimaryNavigation currentPath={currentPath} label="Global navigation" orientation="horizontal" />
          </div>
        </div>
      </header>

      <main
        className={cn("mx-auto min-h-[calc(100vh-112px)] max-w-[1340px] scroll-mt-40 px-4 py-7 md:px-8 md:py-10")}
        id="main-content"
      >
        {children}
      </main>
      <p className="hidden print:block print:px-8 print:pb-6 print:text-xs">
        Educational analysis only. This is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.
      </p>
    </div>
  );
}
