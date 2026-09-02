"use client";

import Link from "next/link";
import { FileText, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { abortDirectUploadAction, completeAnnualReportUploadAction, prepareAnnualReportUploadAction } from "@/app/workspace/actions";
import { Button } from "@/components/ui/button";
import type { AnnualReportReviewDraft } from "@/features/annual-report-ingestion/review-types";
import type { AccountSessionState } from "@/features/accounts/auth-session-provider";

export function AnnualReportUpload({ session, onDraftReady }: { session: AccountSessionState; onDraftReady: (draft: AnnualReportReviewDraft) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function extract() {
    const file = inputRef.current?.files?.item(0);
    if (!file) {
      setMessage("Choose a PDF annual report before extraction.");
      return;
    }
    setPending(true);
    setMessage(null);
    const prepared = await prepareAnnualReportUploadAction({
      originalFilename: file.name,
      mimeType: file.type || "application/pdf",
      sizeBytes: file.size,
    });
    if (!prepared.uploadUrl || !prepared.ticket) {
      setPending(false);
      setMessage(prepared.error ?? "The annual report could not be prepared for private upload.");
      return;
    }
    let result: Awaited<ReturnType<typeof completeAnnualReportUploadAction>>;
    try {
      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type || "application/pdf", "x-upsert": "false" },
      });
      if (!response.ok) throw new Error("Private upload failed.");
      result = await completeAnnualReportUploadAction(prepared.ticket);
    } catch {
      await abortDirectUploadAction(prepared.ticket);
      result = { error: "The annual report could not be uploaded safely. Please try again." };
    }
    setPending(false);
    if (result.draft) {
      onDraftReady(result.draft);
      setMessage("PDF evidence prepared for review in Financial Input.");
      return;
    }
    setMessage(result.error ?? "The annual report could not be extracted safely.");
  }

  if (session.status !== "authenticated") {
    return (
      <section aria-labelledby="annual-report-upload-title" className="premium-panel rounded-lg p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="premium-kicker">Annual report</p>
            <h2 className="mt-2 text-h4 font-semibold text-white" id="annual-report-upload-title">Extract a private PDF into this input.</h2>
            <p className="mt-2 max-w-2xl text-small leading-6 text-neutral-400">Sign in to privately upload an annual report, review every extracted value with its source evidence and complete any unresolved period manually.</p>
          </div>
          <Button asChild variant="secondary"><Link href="/login?next=/input"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Sign in to analyze an annual report</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="annual-report-upload-title" className="premium-panel rounded-lg p-5 md:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="premium-kicker">Annual report</p>
          <h2 className="mt-2 text-h4 font-semibold text-white" id="annual-report-upload-title">Start from a private annual-report PDF.</h2>
          <p className="mt-2 max-w-2xl text-small leading-6 text-neutral-400">Native text is extracted locally by the server pipeline. Scanned pages stay unresolved, and every accepted value remains linked to its document evidence.</p>
          <label className="mt-4 grid max-w-xl gap-2 text-small font-semibold text-neutral-200" htmlFor="annual-report-file">
            Select annual-report PDF
            <input accept="application/pdf,.pdf" className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-small font-normal text-neutral-300 file:mr-3 file:rounded-sm file:border-0 file:bg-blue-500/15 file:px-3 file:py-1.5 file:text-caption file:font-semibold file:text-blue-100" id="annual-report-file" ref={inputRef} type="file" />
          </label>
        </div>
        <Button disabled={pending} onClick={() => void extract()} type="button">
          {pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <FileText aria-hidden="true" className="h-4 w-4" />}
          {pending ? "Preparing review" : "Extract PDF values"}
        </Button>
      </div>
      {message ? <p className="mt-4 text-caption text-neutral-300" role={message.startsWith("PDF") ? "status" : "alert"}>{message}</p> : null}
      <p className="mt-4 flex items-center gap-2 text-caption text-neutral-500"><Upload aria-hidden="true" className="h-3.5 w-3.5" />Private workspace upload. No OCR, guessed values or external enrichment.</p>
    </section>
  );
}
