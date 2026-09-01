"use client";

import { ExternalLink, FileCheck2, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { getPrivateFileUrlAction } from "@/app/workspace/actions";
import { Button } from "@/components/ui/button";
import type { AnnualReportReviewDraft } from "@/features/annual-report-ingestion/review-types";

export function AnnualReportReviewSummary({ draft }: { draft: AnnualReportReviewDraft }) {
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resolvedPeriods = draft.periodSlots.filter((slot) => slot.fiscalPeriod !== null).length;
  const suggested = draft.fields.filter((field) => field.reviewState === "NEEDS_REVIEW" && field.currentCandidateId !== null).length;

  async function openSource() {
    setOpening(true);
    setMessage(null);
    const result = await getPrivateFileUrlAction(draft.sourceFileId);
    setOpening(false);
    if (!result.url) {
      setMessage(result.error ?? "The private source document is not available.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <section aria-label="Annual report extraction review" className="border-y border-blue-200/15 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-small font-semibold text-white"><FileCheck2 aria-hidden="true" className="h-4 w-4 text-blue-200" />PDF extraction draft: {draft.sourceFileName}</p>
          <p className="mt-1 text-caption text-neutral-400">{resolvedPeriods} reporting period{resolvedPeriods === 1 ? "" : "s"} resolved from the document. {suggested} suggestion{suggested === 1 ? "" : "s"} still require explicit acceptance. Missing values remain empty.</p>
        </div>
        <Button disabled={opening} onClick={() => void openSource()} type="button" variant="secondary">
          {opening ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ExternalLink aria-hidden="true" className="h-4 w-4" />}
          Open private source
        </Button>
      </div>
      {message ? <p className="mt-3 text-caption text-red-200" role="alert">{message}</p> : null}
    </section>
  );
}
