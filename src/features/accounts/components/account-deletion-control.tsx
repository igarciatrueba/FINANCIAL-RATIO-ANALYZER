"use client";

import { useActionState, useEffect } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { deleteCurrentAccountAction, type WorkspaceActionState } from "@/app/workspace/actions";
import { useAccountSession } from "@/features/accounts/auth-session-provider";

const initialState: WorkspaceActionState = { status: "idle" };

export function AccountDeletionControl() {
  const [state, action, pending] = useActionState(deleteCurrentAccountAction, initialState);
  const session = useAccountSession();

  useEffect(() => {
    if (state.status !== "success") return;
    void session.signOut().finally(() => window.location.assign("/"));
  }, [session, state.status]);

  return <section className="border-t border-danger/30 pt-5" aria-labelledby="delete-account-heading">
    <p className="premium-kicker text-red-200">Danger zone</p>
    <h2 className="mt-2 text-h4 font-semibold text-white" id="delete-account-heading">Delete account</h2>
    <p className="mt-2 max-w-xl text-small leading-6 text-neutral-300">This permanently removes your personal workspace, companies, financial data, analyses, scenarios, extraction records and private files. Deletion is unavailable while this account belongs to a shared workspace.</p>
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-caption font-semibold text-neutral-300">Type DELETE to confirm<input aria-label="Type DELETE to confirm account deletion" className="min-h-10 rounded-md border border-danger/45 bg-background px-3 text-small text-white" name="confirmation" required /></label>
      <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-danger/45 px-4 text-small font-semibold text-red-100 hover:bg-danger/10 disabled:opacity-50" disabled={pending} type="submit"><Trash2 aria-hidden="true" className="h-4 w-4" />{pending ? "Deleting account" : "Delete account"}</button>
    </form>
    {state.status === "error" ? <p className="mt-3 text-caption text-red-100" role="alert"><AlertTriangle aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />{state.message}</p> : null}
    {state.status === "success" ? <p className="mt-3 text-caption text-emerald-100" role="status">{state.message}</p> : null}
  </section>;
}
