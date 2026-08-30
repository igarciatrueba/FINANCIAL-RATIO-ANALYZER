"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { useAccountSession } from "@/features/accounts/auth-session-provider";

function initials(value: string) {
  return value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "EQ";
}

export function AccountControl() {
  const session = useAccountSession();

  if (session.status === "loading") return <span aria-label="Checking account session" className="h-8 w-16 animate-pulse rounded-full bg-neutral-800" />;
  if (session.status === "anonymous" || session.status === "session-expired" || session.status === "unavailable") {
    return <Link className="rounded-md px-3 py-2 text-caption font-semibold text-blue-100 transition hover:bg-blue-500/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" href="/login">Sign in</Link>;
  }

  const name = typeof session.user.user_metadata.display_name === "string" ? session.user.user_metadata.display_name : session.user.email ?? "Account";
  return (
    <details className="group relative">
      <summary aria-label="Open account menu" className="flex min-h-9 list-none cursor-pointer items-center gap-2 rounded-md px-2 text-caption font-semibold text-neutral-100 marker:hidden transition hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full border border-blue-300/40 bg-blue-500/15 font-mono text-caption text-blue-100">{initials(name)}</span><span className="hidden max-w-28 truncate lg:block">{name}</span>
      </summary>
      <div className="crystal-surface absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-60 gap-1 rounded-lg p-2 shadow-3">
        <div className="border-b border-border px-3 py-2"><p className="truncate text-small font-semibold text-white">{name}</p><p className="truncate text-caption text-neutral-400">{session.user.email}</p></div>
        <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-small text-neutral-200 hover:bg-blue-500/10 hover:text-white" href="/workspace"><LayoutDashboard aria-hidden="true" className="h-4 w-4 text-blue-200" />Workspace</Link>
        <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-small text-neutral-200 hover:bg-blue-500/10 hover:text-white" href="/account"><UserRound aria-hidden="true" className="h-4 w-4 text-blue-200" />Account</Link>
        <button className="mt-1 flex items-center gap-2 border-t border-border px-3 py-2 text-left text-small text-neutral-200 hover:text-white" onClick={() => void session.signOut().then(() => window.location.assign("/"))} type="button"><LogOut aria-hidden="true" className="h-4 w-4 text-blue-200" />Sign out</button>
      </div>
    </details>
  );
}
