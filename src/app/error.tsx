"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-neutral-50">
      <section className="max-w-[760px] rounded-lg border border-border bg-surface p-8 shadow-1">
        <p className="text-caption uppercase text-danger">Application error</p>
        <h1 className="mt-3 text-h2 font-semibold leading-[1.25]">The page could not be rendered.</h1>
        <p className="mt-4 text-body text-neutral-300">
          Something unexpected interrupted this view. Try reloading the page or return to the
          previous workflow.
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </section>
    </main>
  );
}
