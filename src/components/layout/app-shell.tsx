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
    <div className="min-h-screen bg-background text-neutral-50">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-small focus:font-semibold"
        href="#main-content"
      >
        Skip to content
      </a>

      <header
        className="sticky top-0 z-50 border-b border-border bg-background shadow-1"
        data-sticky-header="true"
      >
        <div className="mx-auto grid max-w-[1280px] gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="min-w-0">
              <Link className="text-small font-semibold text-neutral-50" href="/">
                Financial Ratio Analyzer
              </Link>
              <h1 className="mt-1 text-h4 font-semibold leading-[1.2] text-neutral-50">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-caption text-neutral-400">{subtitle}</p> : null}
            </div>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            <PrimaryNavigation currentPath={currentPath} label="Global navigation" orientation="horizontal" />
          </div>
        </div>
      </header>

      <main
        className={cn("mx-auto min-h-[calc(100vh-112px)] max-w-[1280px] scroll-mt-48 px-4 py-6 md:px-8 md:py-8")}
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
