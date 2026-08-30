"use client";

import { useState } from "react";
import { CloudUpload, LoaderCircle } from "lucide-react";

import { persistFinancialInputAction } from "@/app/workspace/actions";
import { Button } from "@/components/ui/button";
import { useAccountSession } from "@/features/accounts/auth-session-provider";
import { PERSISTED_ANALYSIS_CONTEXT_KEY } from "@/features/accounts/persisted-analysis-context";
import { ACTIVE_ANALYSIS_STORAGE_KEY, recoverActiveAnalysisSession } from "@/features/financial-input/persistence";

export function SaveAnalysisControl() {
  const session = useAccountSession();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    if (session.status !== "authenticated") {
      window.location.assign("/login?next=/analysis");
      return;
    }
    const recovered = recoverActiveAnalysisSession(window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY));
    if (!recovered) {
      setMessage("This local analysis session is unavailable. Return to Financial Input and run it again.");
      return;
    }
    setMessage(null);
    setPending(true);
    const persisted = await persistFinancialInputAction(recovered.data);
    setPending(false);
    if (!persisted.runId || !persisted.companyId || !persisted.datasetVersionId) {
      setMessage(persisted.error ?? "The analysis could not be saved to your workspace.");
      return;
    }
    window.sessionStorage.setItem(PERSISTED_ANALYSIS_CONTEXT_KEY, JSON.stringify({ runId: persisted.runId, companyId: persisted.companyId, datasetVersionId: persisted.datasetVersionId }));
    window.location.assign(`/workspace/analyses/${persisted.runId}`);
  }

  return <div className="flex flex-col items-start gap-2"><Button disabled={pending || session.status === "loading"} onClick={() => void save()} type="button" variant="secondary">{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CloudUpload aria-hidden="true" className="h-4 w-4" />}{session.status === "authenticated" ? "Save to workspace" : "Save analysis"}</Button>{message ? <p className="text-caption text-red-200" role="alert">{message}</p> : null}</div>;
}
