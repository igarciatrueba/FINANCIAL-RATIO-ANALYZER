import Link from "next/link";
import { CheckCircle2, FilePenLine, Library } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintReportButton } from "@/components/print-report-button";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type AnalysisCommandBarProps = {
  viewModel: ExecutiveDashboardViewModel;
};

export function AnalysisCommandBar({ viewModel }: AnalysisCommandBarProps) {
  return (
    <section
      aria-label="Analysis context"
      className="analysis-command-bar rounded-md border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] md:items-center">
          <div className="analysis-status">
            <p className="text-caption uppercase text-neutral-400">Company / Industry</p>
            <p className="mt-1 text-body font-semibold leading-tight text-neutral-50">{viewModel.company.name}</p>
            <p className="text-small text-neutral-400">{viewModel.company.industry}</p>
          </div>
          <ContextItem label="Current vs prior" value={viewModel.period.display} />
          <ContextItem label="Currency" value={viewModel.company.currency} />
          <ContextItem label="Coverage" value={`${viewModel.coverage.displayValue} coverage`} />
          <div>
            <p className="text-caption uppercase text-neutral-400">Status</p>
            <Badge className="pointer-events-none mt-1 gap-2" variant="success">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
              {viewModel.status.label}
            </Badge>
          </div>
        </div>

        <div className="analysis-action-group flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:shrink-0">
          <PrintReportButton />
          <Button asChild>
            <Link aria-label="Edit financials in the financial input workflow" href={viewModel.routes.editInput}>
              <FilePenLine aria-hidden="true" className="h-5 w-5" />
              Edit financials
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link aria-label="Open methodology documentation" href={viewModel.routes.methodology}>
              <Library aria-hidden="true" className="h-5 w-5" />
              Methodology
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption uppercase text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-small font-semibold tabular-nums text-neutral-50">{value}</p>
    </div>
  );
}
