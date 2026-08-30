import Link from "next/link";
import { Building2, FileText, History, LayoutDashboard, SlidersHorizontal } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

const workspaceNavigation = [
  { href: "/workspace", label: "Workspace", icon: LayoutDashboard },
  { href: "/workspace/companies", label: "Companies", icon: Building2 },
  { href: "/workspace/history", label: "Analysis history", icon: History },
  { href: "/workspace/files", label: "Files", icon: FileText },
  { href: "/workspace/scenarios", label: "Saved scenarios", icon: SlidersHorizontal },
];

export function WorkspaceShell({ children, currentPath, subtitle, title }: { children: React.ReactNode; currentPath: string; subtitle: string; title: string }) {
  return (
    <AppShell currentPath={currentPath} subtitle={subtitle} title={title}>
      <nav aria-label="Workspace navigation" className="data-rail mb-8 flex min-w-0 gap-1 overflow-x-auto border-y border-border py-2">
        {workspaceNavigation.map((item) => {
          const Icon = item.icon;
          const current = item.href === currentPath;
          return <Link aria-current={current ? "page" : undefined} className={cn("flex min-h-9 shrink-0 items-center gap-2 rounded-md px-3 text-caption font-semibold text-neutral-400 transition hover:bg-blue-500/10 hover:text-white", current && "crystal-surface text-white")} href={item.href} key={item.href}><Icon aria-hidden="true" className="h-3.5 w-3.5 text-blue-200" />{item.label}</Link>;
        })}
      </nav>
      {children}
    </AppShell>
  );
}

export function WorkspacePageState({ description, title }: { description: string; title: string }) {
  return <section className="premium-panel max-w-xl rounded-xl p-6" role="alert"><p className="premium-kicker">Workspace unavailable</p><h1 className="mt-3 text-h2 font-semibold text-white">{title}</h1><p className="mt-3 text-small leading-6 text-neutral-300">{description}</p><Link className="mt-6 inline-flex text-small font-semibold text-blue-200 hover:text-white" href="/login">Return to sign in</Link></section>;
}

export function formatWorkspaceDate(value: Date | null | undefined) {
  if (!value) return "Unavailable";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(value);
}
