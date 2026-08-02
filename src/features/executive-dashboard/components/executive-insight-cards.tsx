import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DashboardInsightViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ExecutiveInsightCardsProps = {
  title: string;
  type: "strength" | "risk";
  insights: DashboardInsightViewModel[];
};

export function ExecutiveInsightCards({ title, type, insights }: ExecutiveInsightCardsProps) {
  const Icon = type === "strength" ? CheckCircle2 : AlertTriangle;
  const variant = type === "strength" ? "success" : "danger";

  return (
    <section aria-label={`Executive ${type} cards`} className="rounded-md border border-border bg-surface p-5 md:p-6" role="region">
      <div>
        <p className="text-caption uppercase text-neutral-400">Executive insight cards</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50">{title}</h2>
      </div>

      {insights.length === 0 ? (
        <p className="mt-5 rounded-sm border border-border bg-background/35 p-4 text-small text-neutral-300">
          No executive {type} cards were generated.
        </p>
      ) : (
        <ol className="mt-5 grid gap-3">
          {insights.map((insight, index) => (
            <li className="border-l-2 border-border bg-background/25 p-4" key={insight.id}>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface">
                  <span className="sr-only">Insight {index + 1}</span>
                  <Icon aria-hidden="true" className="h-4 w-4 text-neutral-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-small font-semibold text-neutral-50">{insight.title}</h3>
                    <Badge variant={variant}>{insight.severityLabel} severity</Badge>
                    <Badge>{insight.trendLabel}</Badge>
                  </div>
                  <p className="mt-2 text-small text-neutral-300">{insight.explanation}</p>
                  <dl className="mt-4 grid gap-3 text-caption md:grid-cols-[0.8fr_minmax(0,2fr)]">
                    <div className="bg-surface/45 p-3">
                      <dt className="uppercase text-neutral-400">Affected year</dt>
                      <dd className="mt-1 font-semibold text-neutral-100">{insight.affectedYear}</dd>
                    </div>
                    <div className="bg-surface/45 p-3">
                      <dt className="uppercase text-neutral-400">Evidence</dt>
                      <dd className="mt-1 grid gap-1 font-semibold text-neutral-100">
                        {insight.evidence.length > 0
                          ? insight.evidence.map((item) => (
                              <span key={`${insight.id}-${item.label}-${item.context}`}>
                                {item.label}: <span title={item.accessibleText}>{item.value}</span>
                                {item.context ? <span className="font-normal text-neutral-400"> · {item.context}</span> : null}
                              </span>
                            ))
                          : "Unavailable"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
