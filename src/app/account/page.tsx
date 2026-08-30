import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";

import { AccountControl } from "@/features/accounts/components/account-control";
import { WorkspacePageState, WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { loadWorkspaceRoute } from "@/features/workspace/lib/workspace-route-error";
import { resolveAccountContext } from "@/server/accounts/account-context";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const state = await loadWorkspaceRoute(resolveAccountContext, "/account");
  if (state.failure) return <WorkspaceShell currentPath="/account" subtitle="Account settings" title="Account"><WorkspacePageState {...state.failure} /></WorkspaceShell>;
  const { user, workspace } = state.data;
  return <WorkspaceShell currentPath="/account" subtitle="Account identity and supported security actions" title="Account"><section className="grid max-w-2xl gap-6"><div className="premium-ambient border-b border-border pb-7"><p className="premium-kicker">Account</p><h1 className="mt-2 text-h1 font-semibold text-white">Your EQUIVERSE identity</h1><p className="mt-3 text-small text-neutral-300">Your authenticated identity creates and owns this personal workspace. Workspace UUIDs and provider identifiers are intentionally not shown.</p></div><section className="premium-panel rounded-lg p-5"><dl className="grid gap-5 text-small"><div><dt className="text-caption uppercase tracking-[0.08em] text-neutral-500">Email</dt><dd className="mt-1 font-semibold text-white">{user.email}</dd></div><div><dt className="text-caption uppercase tracking-[0.08em] text-neutral-500">Workspace</dt><dd className="mt-1 font-semibold text-white">{workspace.name}</dd></div><div><dt className="text-caption uppercase tracking-[0.08em] text-neutral-500">Display name</dt><dd className="mt-1 font-semibold text-white">{user.displayName ?? "Not provided by your account"}</dd></div></dl></section><section className="open-section flex flex-wrap items-center gap-3"><Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-small font-semibold text-blue-100 hover:bg-blue-500/10" href="/forgot-password"><KeyRound aria-hidden="true" className="h-4 w-4" />Reset password</Link><span className="inline-flex min-h-10 items-center gap-2 text-small text-neutral-300"><LogOut aria-hidden="true" className="h-4 w-4 text-blue-200" />Use the account control in the navigation to sign out.</span><AccountControl /></section></section></WorkspaceShell>;
}
