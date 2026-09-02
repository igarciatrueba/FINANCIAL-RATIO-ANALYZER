"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Archive, Download, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";

import {
  archiveCompanyAction,
  createCompanyAction,
  deleteWorkspaceFileAction,
  getPrivateFileUrlAction,
  updateCompanyAction,
  uploadWorkspaceFileAction,
  type WorkspaceActionState,
} from "@/app/workspace/actions";
import { Button } from "@/components/ui/button";

const initialState: WorkspaceActionState = { status: "idle" };

function ActionMessage({ state }: { state: WorkspaceActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return <p className={state.status === "error" ? "text-caption text-red-200" : "text-caption text-emerald-200"} role={state.status === "error" ? "alert" : "status"}>{state.message}</p>;
}

export function CreateCompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, initialState);
  return <form action={action} className="grid gap-3 rounded-lg border border-border bg-surface/50 p-4 sm:grid-cols-2 sm:items-end"><label className="grid min-w-0 gap-1 text-caption font-semibold text-neutral-300">Company name<input className="min-h-10 min-w-0 rounded-md border border-border bg-background px-3 text-small text-white" name="name" required /></label><label className="grid min-w-0 gap-1 text-caption font-semibold text-neutral-300">Industry<input className="min-h-10 min-w-0 rounded-md border border-border bg-background px-3 text-small text-white" name="industry" required /></label><label className="grid min-w-0 gap-1 text-caption font-semibold text-neutral-300">Currency<select className="min-h-10 min-w-0 rounded-md border border-border bg-background px-3 text-small text-white" defaultValue="EUR" name="currency"><option>EUR</option><option>USD</option><option>GBP</option></select></label><Button className="w-full" disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}Add company</Button><div className="sm:col-span-2"><ActionMessage state={state} /></div></form>;
}

export function CompanyMetadataForm({ company }: { company: { id: string; name: string; industry: string; currency: string } }) {
  const [state, action, pending] = useActionState(updateCompanyAction, initialState);
  return <form action={action} className="grid gap-4 md:grid-cols-3"><input name="companyId" type="hidden" value={company.id} /><label className="grid gap-2 text-small font-semibold text-neutral-200">Company name<input className="min-h-11 rounded-md border border-border bg-background px-3 text-small text-white" defaultValue={company.name} name="name" required /></label><label className="grid gap-2 text-small font-semibold text-neutral-200">Industry<input className="min-h-11 rounded-md border border-border bg-background px-3 text-small text-white" defaultValue={company.industry} name="industry" required /></label><label className="grid gap-2 text-small font-semibold text-neutral-200">Currency<select className="min-h-11 rounded-md border border-border bg-background px-3 text-small text-white" defaultValue={company.currency} name="currency"><option>EUR</option><option>USD</option><option>GBP</option></select></label><div className="flex items-center gap-3 md:col-span-3"><Button disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}Save details</Button><ActionMessage state={state} /></div></form>;
}

export function ArchiveCompanyButton({ companyId }: { companyId: string }) {
  const [state, setState] = useState<WorkspaceActionState>(initialState);
  return <div className="flex flex-wrap items-center gap-3"><button className="inline-flex min-h-9 items-center gap-2 rounded-md border border-danger/40 px-3 text-caption font-semibold text-red-100 hover:bg-danger/10" onClick={() => void archiveCompanyAction(companyId).then(setState)} type="button"><Archive aria-hidden="true" className="h-4 w-4" />Archive company</button><ActionMessage state={state} /></div>;
}

export function FileUploadForm({ companies }: { companies: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(uploadWorkspaceFileAction, initialState);
  return <form action={action} className="control-plane grid gap-3 rounded-lg p-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] sm:items-end"><label className="grid gap-1 text-caption font-semibold text-neutral-300">Private file<input accept=".pdf,.csv,.xlsx" className="min-h-10 text-caption text-neutral-300" name="file" required type="file" /></label><label className="grid gap-1 text-caption font-semibold text-neutral-300">Company<select className="min-h-10 rounded-md border border-border bg-background px-3 text-small text-white" name="companyId"><option value="">Workspace file</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="grid gap-1 text-caption font-semibold text-neutral-300">Category<select className="min-h-10 rounded-md border border-border bg-background px-3 text-small text-white" name="category"><option value="source_document">Source document</option><option value="financial_input">Financial input</option><option value="import">Import</option><option value="report">Report</option></select></label><Button disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}Upload</Button><p className="sm:col-span-full text-caption text-neutral-400">Private PDF, CSV or XLSX only. Maximum 20 MiB.</p><div className="sm:col-span-full"><ActionMessage state={state} /></div></form>;
}

export function FileActions({ fileId }: { fileId: string }) {
  const [state, setState] = useState<WorkspaceActionState>(initialState);
  async function openFile() {
    const result = await getPrivateFileUrlAction(fileId);
    if (result.url) window.open(result.url, "_blank", "noopener,noreferrer");
    else setState({ status: "error", message: result.error });
  }
  return <div className="flex items-center gap-2"><button aria-label="Open private file" className="rounded-md p-2 text-blue-100 hover:bg-blue-500/10" onClick={() => void openFile()} type="button"><Download aria-hidden="true" className="h-4 w-4" /></button><button aria-label="Delete file" className="rounded-md p-2 text-red-100 hover:bg-danger/10" onClick={() => void deleteWorkspaceFileAction(fileId).then(setState)} type="button"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>{state.status === "error" ? <span className="sr-only" role="alert">{state.message}</span> : null}</div>;
}

export function OpenAnalysisLink({ runId }: { runId: string }) {
  return <Link className="text-caption font-semibold text-blue-200 hover:text-white" href={`/workspace/analyses/${runId}`}>Open analysis</Link>;
}
