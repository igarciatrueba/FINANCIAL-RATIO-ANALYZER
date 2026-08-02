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

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-surface lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-6">
            <Link className="text-small font-semibold text-neutral-50" href="/">
              Financial Ratio Analyzer
            </Link>
            <p className="mt-3 text-caption text-neutral-400">Financial intelligence workspace</p>
            <div className="mt-8">
              <PrimaryNavigation currentPath={currentPath} />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95">
            <div className="flex min-h-20 items-center justify-between gap-4 px-6 py-4 md:px-8">
              <div>
                <p className="text-caption uppercase text-neutral-400">Workspace</p>
                <h1 className="text-h4 font-semibold leading-[1.25] text-neutral-50">{title}</h1>
                {subtitle ? <p className="mt-1 text-small text-neutral-400">{subtitle}</p> : null}
              </div>

              <details className="group relative lg:hidden">
                <summary className="cursor-pointer list-none rounded-sm border border-border bg-surface px-4 py-2 text-small font-medium text-neutral-50">
                  Menu
                </summary>
                <div className="absolute right-0 mt-3 w-[min(280px,calc(100vw-48px))] rounded-md border border-border bg-surface-elevated p-3 shadow-2">
                  <PrimaryNavigation currentPath={currentPath} compact label="Mobile primary" />
                </div>
              </details>
            </div>
          </header>

          <main
            className={cn("mx-auto min-h-[calc(100vh-80px)] max-w-[1280px] px-6 py-8 md:px-8 md:py-10")}
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
