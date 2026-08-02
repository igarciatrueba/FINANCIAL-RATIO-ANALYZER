"use client";

import Link from "next/link";
import { CheckCircle2, FileWarning } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTIVE_ANALYSIS_STORAGE_KEY,
  recoverActiveAnalysisSession,
} from "@/features/financial-input/persistence";

function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  return recoverActiveAnalysisSession(window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY));
}

export function AnalysisConfirmation() {
  const session = useMemo(() => readSession(), []);

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <FileWarning aria-hidden="true" className="h-5 w-5 text-warning" />
          <CardTitle>No accepted analysis found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-[760px] text-small text-neutral-300">
            No valid Phase 4 analysis session is available. Load a demo company or enter financial data, then run the
            final validation again.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/input">Return to financial input</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const years = session.data.periods.map((period) => period.year).join(", ");

  return (
    <Card>
      <CardHeader>
        <Badge variant="success">Phase 4 confirmation</Badge>
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-success" />
        <CardTitle>Canonical dataset accepted</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 text-small md:grid-cols-3">
          <div>
            <dt className="text-neutral-400">Company</dt>
            <dd className="mt-1 font-semibold text-neutral-50">{session.data.company.name}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Reporting years</dt>
            <dd className="mt-1 font-semibold text-neutral-50">{years}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Currency</dt>
            <dd className="mt-1 font-semibold text-neutral-50">{session.data.company.currency}</dd>
          </div>
        </dl>
        <p className="mt-6 max-w-[760px] text-small text-neutral-300">
          The canonical dataset was accepted and financial metrics are ready for the next approved phase. The final
          executive dashboard, score, insights and charts are intentionally not implemented in Phase 4.
        </p>
      </CardContent>
    </Card>
  );
}
