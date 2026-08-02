import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-neutral-50">
      <section className="max-w-[760px] rounded-lg border border-border bg-surface p-8 shadow-1">
        <p className="text-caption uppercase text-warning">Route unavailable</p>
        <h1 className="mt-3 text-h2 font-semibold leading-[1.25]">This page is not part of the current workspace.</h1>
        <p className="mt-4 text-body text-neutral-300">
          The MVP has a small approved navigation structure. Use the application routes to continue.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Return to overview</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
