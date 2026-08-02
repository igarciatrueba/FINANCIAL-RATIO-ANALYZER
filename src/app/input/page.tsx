import Link from "next/link";

import { FinancialInputWorkflow } from "@/features/financial-input/workflow";

export default function InputPage() {
  return (
    <main className="min-h-screen bg-background text-neutral-50">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-caption uppercase text-neutral-400">Financial Input</p>
            <h1 className="text-h3 font-semibold leading-[1.25] text-neutral-50">Guided statement workflow</h1>
            <p className="mt-1 text-small text-neutral-400">Three annual periods, explicit validation and canonical handoff.</p>
          </div>
          <Link className="text-small font-semibold text-primary hover:text-information" href="/">
            Financial Ratio Analyzer
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-8 md:py-10">
        <FinancialInputWorkflow />
      </div>
    </main>
  );
}
