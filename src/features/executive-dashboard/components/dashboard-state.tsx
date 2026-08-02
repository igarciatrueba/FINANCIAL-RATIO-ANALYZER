import Link from "next/link";
import { AlertTriangle, FileInput, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardLoading() {
  return (
    <section
      aria-live="polite"
      className="rounded-md border border-border bg-surface p-6"
      role="status"
    >
      <div className="flex items-start gap-4">
        <Loader2 aria-hidden="true" className="mt-1 h-5 w-5 animate-spin text-information" />
        <div>
          <h2 className="text-h4 font-semibold text-neutral-50">Preparing local analysis</h2>
          <p className="mt-2 max-w-[720px] text-small text-neutral-300">
            Recovering the accepted browser session, validating the canonical dataset and calculating the executive
            dashboard locally.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DashboardEmpty() {
  return (
    <section className="rounded-md border border-border bg-surface p-6">
      <div className="flex items-start gap-4">
        <FileInput aria-hidden="true" className="mt-1 h-5 w-5 text-information" />
        <div>
          <h2 className="text-h3 font-semibold text-neutral-50">Financial statements are required</h2>
          <p className="mt-2 max-w-[720px] text-small text-neutral-300">
            No active analysis session exists in this browser. Enter financial statements or load a fictional demo
            company, then analyse the company again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/input">Go to financial input</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/methodology">View methodology</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

type DashboardErrorProps = {
  title?: string;
  message: string;
};

export function DashboardError({ title = "Analysis session could not be read", message }: DashboardErrorProps) {
  return (
    <section className="rounded-md border border-danger/40 bg-danger/10 p-6" role="alert">
      <div className="flex items-start gap-4">
        <AlertTriangle aria-hidden="true" className="mt-1 h-5 w-5 text-danger" />
        <div>
          <h2 className="text-h3 font-semibold text-neutral-50">{title}</h2>
          <p className="mt-2 max-w-[720px] text-small text-neutral-200">{message}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/input">Return to financial input</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/methodology">View methodology</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
