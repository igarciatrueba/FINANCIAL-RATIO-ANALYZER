import Link from "next/link";
import { BarChart3, CheckCircle2, FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DupontAnalysisViewModel } from "@/features/dupont-analysis/types/dupont.types";

type DupontContextBarProps = {
  viewModel: DupontAnalysisViewModel;
};

export function DupontContextBar({ viewModel }: DupontContextBarProps) {
  return (
    <section aria-label="Analysis context" className="rounded-md border border-border bg-surface p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-caption uppercase text-neutral-400">Company</p>
            <p className="mt-1 text-small font-semibold text-neutral-50">{viewModel.company.name}</p>
            <p className="text-caption text-neutral-400">{viewModel.company.industry}</p>
          </div>
          <div>
            <p className="text-caption uppercase text-neutral-400">Period</p>
            <p className="mt-1 font-mono text-small text-neutral-50">{viewModel.period.display}</p>
          </div>
          <div>
            <p className="text-caption uppercase text-neutral-400">Currency</p>
            <p className="mt-1 font-mono text-small text-neutral-50">{viewModel.company.currency}</p>
          </div>
          <div>
            <p className="text-caption uppercase text-neutral-400">Identity status</p>
            <p className="mt-1 flex items-center gap-2 text-small text-neutral-50">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" />
              {viewModel.availability.label}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <Button asChild variant="secondary">
            <Link href={viewModel.routes.dashboard}>
              <BarChart3 aria-hidden="true" className="h-4 w-4" />
              Executive dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={viewModel.routes.editInput}>
              <FilePenLine aria-hidden="true" className="h-4 w-4" />
              Edit financials
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={viewModel.routes.methodology}>Methodology</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
